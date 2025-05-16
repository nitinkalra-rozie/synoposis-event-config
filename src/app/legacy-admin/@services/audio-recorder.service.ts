import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// TODO: Update MicrophoneStream to use the latest version
import MicrophoneStream from 'microphone-stream';
import { EMPTY, Observable, Subject, from, throwError, timer } from 'rxjs';
import {
  bufferTime,
  catchError,
  finalize,
  mergeMap,
  retry,
  takeUntil,
} from 'rxjs/operators';
import { AUDIO_SAMPLE_RATE } from 'src/app/legacy-admin/@constants/audio-constants';
import {
  AudioRecorderResponse,
  SessionAudioChunk,
} from 'src/app/legacy-admin/@data-services/audio-recorder/audio-recorder.data-model';
import { AudioRecorderDataService } from 'src/app/legacy-admin/@data-services/audio-recorder/audio-recorder.data-service';
import {
  downsampleBuffer,
  pcmEncode,
} from 'src/app/legacy-admin/helpers/audioUtils';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private readonly _audioRecorderDataService = inject(AudioRecorderDataService);
  private readonly _ngZone = inject(NgZone);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _maxBatchPayloadBytes = 600 * 1024;
  private readonly _apiRetryCount = 2;
  private readonly _apiRetryDelayMs = 1000;
  private readonly _pollingIntervalMs = 3000;

  private _chunk$ = new Subject<Uint8Array>();
  private _shutdown$ = new Subject<void>();

  private _eventName: string;
  private _sessionId: string;

  init(eventName: string, sessionId: string): void {
    this._shutdown$.next();
    this._shutdown$ = new Subject<void>();

    this._eventName = eventName;
    this._sessionId = sessionId;
    console.log(`Initialized for ${eventName} ${sessionId}`);

    this._ngZone.runOutsideAngular(() => this.buildPipeline());
  }

  handleRawChunk(data: Buffer): void {
    const raw = data && MicrophoneStream.toRaw(data);
    if (!raw) return;

    const down = downsampleBuffer(raw, AUDIO_SAMPLE_RATE);
    const pcm = pcmEncode(down);
    this._chunk$.next(new Uint8Array(pcm));
  }

  flushAndClose(): void {
    this._shutdown$.next();
    this._shutdown$.complete();
  }

  private buildPipeline(): void {
    this._chunk$
      .pipe(
        bufferTime(this._pollingIntervalMs),
        takeUntil(this._shutdown$),
        takeUntilDestroyed(this._destroyRef),
        mergeMap((buffer) => {
          if (buffer.length === 0) return EMPTY;

          return this.uploadMergedBatches(buffer).pipe(
            catchError((err) => {
              console.error('Upload batch error, continuing', err);
              return EMPTY;
            })
          );
        }),
        finalize(() => {
          console.log('Audio pipeline stopped');
        })
      )
      .subscribe();
  }

  private uploadMergedBatches(
    chunks: Uint8Array[]
  ): Observable<void | AudioRecorderResponse> {
    if (!this._eventName || !this._sessionId) {
      console.warn('Skipping upload—missing event/session');
      return EMPTY;
    }

    const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }

    const slices: Uint8Array[] = [];
    for (let i = 0; i < merged.byteLength; i += this._maxBatchPayloadBytes) {
      slices.push(merged.subarray(i, i + this._maxBatchPayloadBytes));
    }

    return from(slices).pipe(
      mergeMap((slice) => this.uploadSliceWithRetry(slice), 1)
    );
  }

  private uploadSliceWithRetry(
    slice: Uint8Array
  ): Observable<AudioRecorderResponse | void> {
    const makePayload = (): SessionAudioChunk => ({
      eventName: this._eventName,
      sessionId: this._sessionId,
      chunkBase64: this.encodeBase64(slice),
      timestamp: Date.now(),
    });

    return from(
      this._audioRecorderDataService.uploadAudioChunk(makePayload())
    ).pipe(
      retry({
        count: this._apiRetryCount,
        delay: (error, retryAttempt) =>
          timer(this._apiRetryDelayMs * Math.pow(2, retryAttempt)),
      }),
      catchError((err) => {
        console.error('Slice upload failed after retries:', err);
        return throwError(() => err);
      })
    );
  }

  private encodeBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }
}

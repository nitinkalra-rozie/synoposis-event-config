import { Injectable, NgZone, OnDestroy } from '@angular/core';
import MicrophoneStream from 'microphone-stream';
import {
  from,
  Observable,
  of,
  Subject,
  Subscription,
  throwError,
  timer,
} from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  retryWhen,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { SessionAudioChunk } from 'src/app/legacy-admin/shared/types';
import { downsampleBuffer, pcmEncode } from '../helpers/audioUtils';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService implements OnDestroy {
  constructor(
    private backend: BackendApiService,
    private ngZone: NgZone
  ) {
    this.ngZone.runOutsideAngular(() => this.setupBufferPipeline());
  }

  private readonly _maxBatchBytes = 512 * 1024;
  private readonly _flushPollMs = 5000;
  private readonly _apiRetryCount = 2;
  private readonly _apiRetryDelayMs = 1000;

  public eventName!: string;
  public sessionId!: string;

  private _buffer: Uint8Array[] = [];
  private _bufferBytes = 0;

  private _chunk$ = new Subject<Uint8Array>();
  private _destroy$ = new Subject<void>();
  private _subs = new Subscription();

  init(eventName: string, sessionId: string): void {
    this.eventName = eventName;
    this.sessionId = sessionId;
    console.log('AudioRecorderService initialized with event name:', eventName);
  }

  handleRawChunk(data: any): void {
    console.log('Audio chunk received:');
    const raw = data && MicrophoneStream.toRaw(data);
    if (!raw) {
      return;
    }

    const down = downsampleBuffer(raw, 16000);
    const pcm = pcmEncode(down);
    this._chunk$.next(new Uint8Array(pcm));
  }

  async flushAndClose(): Promise<void> {
    this._destroy$.next();
    this._destroy$.complete();
    this._chunk$.complete();
    this._subs.unsubscribe();

    const leftover = this.drainBuffer();
    if (leftover.length > 0) {
      await this.uploadMergedBatches(leftover).toPromise();
    }
  }

  ngOnDestroy(): void {
    this.flushAndClose()?.finally(() => {
      console.debug('AudioRecorderService destroyed cleanly.');
    });
  }

  private setupBufferPipeline(): void {
    const collectSub = this._chunk$
      .pipe(takeUntil(this._destroy$))
      .subscribe((chunk) => {
        this._buffer.push(chunk);
        this._bufferBytes += chunk.byteLength;
      });

    const pollSub = timer(0, this._flushPollMs)
      .pipe(
        takeUntil(this._destroy$),
        filter(() => this._bufferBytes >= this._maxBatchBytes),
        switchMap(() => {
          const toUpload = this.drainBuffer();
          return this.uploadMergedBatches(toUpload);
        })
      )
      .subscribe({
        error: (err) => console.error('Buffer pipeline error:', err),
      });

    this._subs.add(collectSub);
    this._subs.add(pollSub);
  }

  private drainBuffer(): Uint8Array[] {
    const drained = this._buffer;
    this._buffer = [];
    this._bufferBytes = 0;
    return drained;
  }

  private uploadMergedBatches(chunks: Uint8Array[]): Observable<void> {
    if (!this.eventName || !this.sessionId || chunks.length === 0) {
      console.warn('No event name or session ID set, skipping upload.');
      return of(void 0);
    }

    console.log('Uploading merged batches:', chunks.length);

    const totalLen = chunks.reduce((sum, b) => sum + b.byteLength, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }

    const slices: Uint8Array[] = [];
    for (let i = 0; i < merged.byteLength; i += this._maxBatchBytes) {
      slices.push(merged.subarray(i, i + this._maxBatchBytes));
    }

    return from(slices).pipe(
      concatMap((slice) => this.uploadSliceWithRetry(slice))
    );
  }

  private uploadSliceWithRetry(slice: Uint8Array): Observable<void> {
    const makePayload = (): SessionAudioChunk => ({
      eventName: this.eventName,
      sessionId: this.sessionId,
      chunkBase64: this.encodeBase64(slice),
      timestamp: Date.now(),
    });

    return of(null).pipe(
      switchMap(() => this.backend.uploadAudioChunk(makePayload()).toPromise()),
      retryWhen((errors) =>
        errors.pipe(
          concatMap((err, i) =>
            i < this._apiRetryCount
              ? timer(this._apiRetryDelayMs * Math.pow(2, i))
              : throwError(err)
          )
        )
      ),
      catchError((err) => {
        console.error('Slice upload failed after retries:', err);
        return of(void 0); // swallow and continue
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

import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, timer } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import {
  CentralizedViewTranscriptEventType,
  CentralizedViewTranscriptWebSocketMessage,
} from 'src/app/av-workspace/data-services/centralized-view-transcript-websocket/centralized-view-transcript-websocket.data-model';
import { CentralizedViewTranscriptWebSocketDataService } from 'src/app/av-workspace/data-services/centralized-view-transcript-websocket/centralized-view-transcript-websocket.data-service';
import { CentralizedViewTranscriptWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-transcript-websocket-store';
import { TranscriptContentStore } from 'src/app/av-workspace/stores/transcript-content-store';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

type EventTypeSubjects = {
  [K in CentralizedViewTranscriptEventType]: Subject<CentralizedViewTranscriptWebSocketMessage>;
};

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewTranscriptWebSocketFacade {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _webSocketDataService = inject(
    CentralizedViewTranscriptWebSocketDataService
  );
  private readonly _webSocketStore = inject(
    CentralizedViewTranscriptWebSocketStore
  );
  private readonly _transcriptContentStore = inject(TranscriptContentStore);
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);

  private readonly _eventSubjects: EventTypeSubjects = {
    SESSION_LIVE_TRANSCRIPT:
      new Subject<CentralizedViewTranscriptWebSocketMessage>(),
  };

  connect(selectedStage: string): void {
    const isConnected = this._webSocketStore.$isConnected();
    const isConnecting = this._webSocketStore.$isConnecting();
    const connectedStage = this._webSocketStore.$connectedStage();

    if (connectedStage === selectedStage || isConnecting || isConnected) {
      return;
    }

    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      this._webSocketStore.setError(
        'No event name available for Transcript WebSocket initialization'
      );
      return;
    }

    this._webSocketDataService
      .connect(selectedStage)
      .pipe(
        catchError((error) => {
          this._webSocketStore.setError(
            `WebSocket connection failed: ${error.message || 'Unknown error'}`
          );
          this._transcriptContentStore.setError(
            'Failed to connect to transcript feed'
          );
          this._transcriptContentStore.setLoading(false);
          throw error;
        }),
        retry({
          count: 5,
          delay: (error, retryCount) => {
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
            return timer(delay);
          },
        }),
        tap((message) => {
          if (this._webSocketStore.$error()) {
            this._webSocketStore.setError(null);
            this._transcriptContentStore.setError(null);
          }
          this._routeMessage(message);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        error: (error) => {
          this._webSocketStore.setError(
            'WebSocket connection failed after retries: ' + error.message
          );
          this._transcriptContentStore.setError(
            'Failed to connect to transcript feed: ' + error.message
          );
          this._transcriptContentStore.setLoading(false);
        },
      });
  }

  disconnect(): void {
    this._transcriptContentStore.clearTranscript();
    this._webSocketDataService.disconnect();
    this._cleanupSubjects();
  }

  private _routeMessage(
    message: CentralizedViewTranscriptWebSocketMessage
  ): void {
    const subject = this._eventSubjects[message.eventType];
    if (subject) {
      subject.next(message);
    }

    if (message.eventType === 'SESSION_LIVE_TRANSCRIPT') {
      this._transcriptContentStore.updateTranscript(
        message.sessionId,
        message.stage,
        message.payload.transcript,
        message.payload.timestamp
      );

      this._transcriptContentStore.setLoading(false);
    }
  }

  private _cleanupSubjects(): void {
    Object.values(this._eventSubjects).forEach((subject) => {
      subject.complete();
    });
  }
}

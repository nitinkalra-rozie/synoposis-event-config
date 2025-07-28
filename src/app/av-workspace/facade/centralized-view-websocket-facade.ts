import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, timer } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import {
  CentralizedViewEventType,
  CentralizedViewWebSocketMessage,
} from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-model';
import { CentralizedViewWebSocketDataService } from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-service';
import { CentralizedViewWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-websocket-store';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

type EventTypeSubjects = {
  [K in CentralizedViewEventType]: Subject<CentralizedViewWebSocketMessage>;
};

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewWebSocketFacade {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _webSocketDataService = inject(
    CentralizedViewWebSocketDataService
  );
  private readonly _webSocketStore = inject(CentralizedViewWebSocketStore);
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);

  private readonly _eventSubjects: EventTypeSubjects = {
    SESSION_LIVE_LISTENING: new Subject<CentralizedViewWebSocketMessage>(),
    SESSION_LIVE_LISTENING_PAUSED:
      new Subject<CentralizedViewWebSocketMessage>(),
    SESSION_END: new Subject<CentralizedViewWebSocketMessage>(),
    SET_AUTOAV_SETUP: new Subject<CentralizedViewWebSocketMessage>(),
    STAGE_STATUS_UPDATED: new Subject<CentralizedViewWebSocketMessage>(),
  };

  public sessionLiveListening$: Observable<CentralizedViewWebSocketMessage> =
    this._eventSubjects.SESSION_LIVE_LISTENING.asObservable();

  public sessionPaused$: Observable<CentralizedViewWebSocketMessage> =
    this._eventSubjects.SESSION_LIVE_LISTENING_PAUSED.asObservable();

  public sessionEnd$: Observable<CentralizedViewWebSocketMessage> =
    this._eventSubjects.SESSION_END.asObservable();

  public autoAvSetup$: Observable<CentralizedViewWebSocketMessage> =
    this._eventSubjects.SET_AUTOAV_SETUP.asObservable();

  public stageStatusUpdate$: Observable<CentralizedViewWebSocketMessage> =
    this._eventSubjects.STAGE_STATUS_UPDATED.asObservable();

  connect(): void {
    if (
      this._webSocketStore.$isConnected() ||
      this._webSocketStore.$isConnecting()
    ) {
      return;
    }

    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      this._webSocketStore.setError(
        'No event name available for WebSocket initialization'
      );
      return;
    }

    this._webSocketDataService
      .connect()
      .pipe(
        catchError((error) => {
          this._webSocketStore.setError(
            `WebSocket connection failed: ${error.message || 'Unknown error'}`
          );
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
          }
          this._routeMessage(message);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        error: (error) => {
          this._webSocketStore.setError(
            'WebSocket connection failed after retries'
          );
        },
      });
  }

  disconnect(): void {
    this._webSocketDataService.disconnect();
    this._cleanupSubjects();
  }

  private _routeMessage(message: CentralizedViewWebSocketMessage): void {
    const subject = this._eventSubjects[message.eventType];
    if (subject) {
      subject.next(message);
    }
  }

  private _cleanupSubjects(): void {
    Object.values(this._eventSubjects).forEach((subject) => {
      subject.complete();
    });
  }
}

import { inject, Injectable } from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { switchMap, take, takeUntil, tap } from 'rxjs/operators';
import {
  CentralizedViewTranscriptWebSocketMessage,
  CentralizedViewTranscriptWebSocketOutgoingMessage,
} from 'src/app/av-workspace/data-services/centralized-view-transcript-websocket/centralized-view-transcript-websocket.data-model';
import {} from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-model';
import { CentralizedViewTranscriptWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-transcript-websocket-store';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CentralizedViewTranscriptWebSocketDataService {
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _webSocketStore = inject(
    CentralizedViewTranscriptWebSocketStore
  );

  private _socket!: WebSocket;
  private _pingDestroy$ = new Subject<void>();

  connect(
    selectedStage: string
  ): Observable<CentralizedViewTranscriptWebSocketMessage> {
    this._webSocketStore.setConnecting(true);

    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      throw new Error('No event name available for WebSocket connection');
    }

    const webSocketUrl = `${environment.wsUrl}?eventName=${eventName}&stage=${selectedStage}`;

    return this._authFacade.getAccessToken$().pipe(
      take(1),
      switchMap(
        (token) =>
          new Observable<CentralizedViewTranscriptWebSocketMessage>(
            (observer) => {
              /**
               * We've used the most suitable approach for the WebSocket authentication ATM. That's Sec-WebSocket-Protocol
               * For more context: https://github.com/aws-samples/websocket-api-cognito-auth-sample/issues/15#issuecomment-1173401338
               */
              this._socket = new WebSocket(webSocketUrl, token);

              this._socket.onopen = () => {
                this._webSocketStore.setConnected(true);
                this._webSocketStore.setConnecting(false);
                this._webSocketStore.setConnectedStage(selectedStage);
                this._sendMessage({
                  eventName: eventName,
                  client: true,
                  event: 'getLastEvent',
                });
                this._startPing(eventName);
              };

              this._socket.onmessage = (event: MessageEvent) => {
                try {
                  const parsedMessage: CentralizedViewTranscriptWebSocketMessage =
                    JSON.parse(event.data);
                  observer.next(parsedMessage);
                } catch (error) {
                  this._webSocketStore.setError(
                    'Centralized View Transcript WebSocket failed to parse message'
                  );
                  observer.error(error);
                }
              };

              this._socket.onerror = (error: Event) => {
                observer.error(
                  'Centralized View Transcript WebSocket error: ' + error
                );
              };

              this._socket.onclose = (_event: CloseEvent) => {
                this.disconnect();
                observer.complete();
              };
            }
          )
      )
    );
  }

  disconnect(): void {
    this._clearPing();
    if (this._socket) {
      this._socket.onclose = function () {}; // disable onclose handler first
      this._socket.close();
      this._socket = null as unknown as WebSocket; // ensure the socket doesn't have older references
      this._webSocketStore.setConnected(false);
      this._webSocketStore.setConnectedStage(null);
    }
  }

  private _sendMessage(
    message: CentralizedViewTranscriptWebSocketOutgoingMessage
  ): void {
    if (this._webSocketStore.$isConnected()) {
      this._socket.send(JSON.stringify(message));
    } else {
      this._webSocketStore.setError('WebSocket connection lost');
    }
  }

  private _startPing(eventName: string): void {
    this._clearPing();
    interval(30000)
      .pipe(
        tap(() => {
          if (this._webSocketStore.$isConnected()) {
            this._sendMessage({
              eventName: eventName,
              client: true,
              event: 'ping',
            });
          }
        }),
        takeUntil(this._pingDestroy$)
      )
      .subscribe();
  }

  private _clearPing(): void {
    this._pingDestroy$.next();
  }
}

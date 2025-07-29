import { inject, Injectable } from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { EventStageWebSocketMessageData } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-model';
import { BrowserWindowService } from 'src/app/legacy-admin/@services/browser-window.service';
import { EventStageWebSocketStateService } from 'src/app/legacy-admin/@store/event-stage-web-socket-state.service';
import { getInsightsDomainUrl } from 'src/app/legacy-admin/@utils/get-domain-urls-util';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { SynToastFacade } from 'src/app/shared/components/syn-toast/syn-toast-facade';
import { setLocalStorageItem } from 'src/app/shared/utils/local-storage-util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventStageWebsocketDataService {
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);
  private readonly _browserWindowService = inject(BrowserWindowService);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _eventStageWebSocketState = inject(
    EventStageWebSocketStateService
  );
  private readonly _toastFacade = inject(SynToastFacade);

  private _socket!: WebSocket;
  private _pingDestroy$ = new Subject<void>();

  connect(selectedLocation: string): Observable<MessageEvent> {
    this._eventStageWebSocketState.setConnecting(true);

    const eventName = this._legacyBackendApiService.getCurrentEventName();
    const webSocketUrl = `${environment.wsUrl}?eventName=${eventName}&stage=${selectedLocation}`;

    return this._authFacade.getAccessToken$().pipe(
      take(1),
      switchMap(
        (token) =>
          new Observable<MessageEvent>((observer) => {
            /**
             * We've used the most suitable approach for the WebSocket authentication ATM. That's Sec-WebSocket-Protocol
             * For more context: https://github.com/aws-samples/websocket-api-cognito-auth-sample/issues/15#issuecomment-1173401338
             */
            this._socket = new WebSocket(webSocketUrl, token);

            this._socket.onopen = () => {
              this._eventStageWebSocketState.setConnected(true);
              this._eventStageWebSocketState.setConnecting(false);
              this._eventStageWebSocketState.setConnectedStage(
                selectedLocation
              );
              this._sendMessage({
                eventName: eventName,
                client: true,
                event: 'getLastEvent',
                stage: selectedLocation,
              });
              console.log('WebSocket connection established.');
              this._startPing(eventName, selectedLocation);
            };

            this._socket.onmessage = (event: MessageEvent) => {
              this._handleWebSocketMessage(event.data);
              observer.next(event);
            };

            this._socket.onerror = (error: Event) => {
              this._toastFacade.showError(
                `Stage WebSocket connection error for ${selectedLocation}`,
                5000
              );
              observer.error('Session WebSocket error: ' + error);
            };

            this._socket.onclose = (event: CloseEvent) => {
              console.log('WebSocket connection closed:', event);
              this.disconnect();
              observer.complete();
            };

            return () => {
              console.log(
                'WebSocket observable unsubscribed, disconnecting...'
              );
              this.disconnect();
            };
          })
      )
    );
  }

  disconnect(): void {
    this._clearPing();
    if (this._socket) {
      this._socket.onclose = function () {}; // disable onclose handler first
      this._socket.close();
      this._socket = null as unknown as WebSocket; // ensure the socket doesn't have older references
      this._eventStageWebSocketState.setConnected(false);
      this._eventStageWebSocketState.setConnectedStage(null);
      this._eventStageWebSocketState.setAutoAvEnabled(false);
    }
  }

  private _sendMessage(message: any): void {
    if (this._socket?.readyState === WebSocket.OPEN) {
      this._socket.send(JSON.stringify(message));
    } else {
      this._toastFacade.showError('Stage WebSocket is not connected', 5000);
    }
  }

  private _handleWebSocketMessage(message: string): void {
    const parsedMessage: EventStageWebSocketMessageData = JSON.parse(message);
    const { eventType, sessionId } = parsedMessage;
    console.log('Parsed WebSocket message:', parsedMessage);

    switch (eventType) {
      case 'SESSION_LIVE_LISTENING':
        this._eventStageWebSocketState.setSessionLiveListening(parsedMessage);
        this._updateBrowserWindowUrl(sessionId);
        break;
      case 'SESSION_LIVE_LISTENING_PAUSED':
        this._eventStageWebSocketState.setSessionPaused(parsedMessage);
        break;
      case 'SESSION_END':
        this._eventStageWebSocketState.setSessionEnd(parsedMessage);
        break;
      case 'SET_AUTOAV_SETUP':
        if (typeof parsedMessage.autoAv === 'boolean') {
          this._eventStageWebSocketState.setAutoAvEnabled(parsedMessage.autoAv);
          setLocalStorageItem('IS_AUTO_AV_ENABLED', parsedMessage.autoAv);
        }
        break;
      case 'SESSION_SPEAKERS_BIOS':
        this._updateBrowserWindowUrl(sessionId);
        break;
      default:
    }
  }

  private _updateBrowserWindowUrl(sessionId: string): void {
    const newUrl = `${getInsightsDomainUrl()}/session/${sessionId}?isPrimaryScreen=true`;
    this._browserWindowService.openInsightsSessionWindow(newUrl);
  }

  private _startPing(eventName: string, selectedLocation: string): void {
    this._clearPing();
    interval(30000)
      .pipe(
        tap(() => {
          if (this._socket?.readyState === WebSocket.OPEN) {
            this._sendMessage({
              eventName: eventName,
              client: true,
              event: 'ping',
              stage: selectedLocation,
            });
            console.log('Ping sent to keep WebSocket alive');
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

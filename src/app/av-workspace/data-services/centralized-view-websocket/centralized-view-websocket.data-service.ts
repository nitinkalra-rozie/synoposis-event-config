import { inject, Injectable } from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { switchMap, take, takeUntil, tap } from 'rxjs/operators';
import {
  CentralizedViewWebSocketMessage,
  CentralizedViewWebSocketOutgoingMessage,
} from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-model';
import { CentralizedViewWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-websocket-store';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { EventConfigStateService } from 'src/app/core/stores/event-config-store';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewWebSocketDataService {
  private readonly _eventConfigStateService = inject(EventConfigStateService);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _webSocketStore = inject(CentralizedViewWebSocketStore);

  private _socket!: WebSocket;
  private _pingDestroy$ = new Subject<void>();

  connect(): Observable<CentralizedViewWebSocketMessage> {
    this._webSocketStore.setConnecting(true);

    const eventIdentifier = this._eventConfigStateService.$eventIdentifier();
    if (!eventIdentifier) {
      throw new Error('No event name available for WebSocket connection');
    }

    const webSocketUrl = `${environment.wsUrl}?eventName=${eventIdentifier}&cms=true`;

    return this._authFacade.getAccessToken$().pipe(
      take(1),
      switchMap(
        (token) =>
          new Observable<CentralizedViewWebSocketMessage>((observer) => {
            /**
             * We've used the most suitable approach for the WebSocket authentication ATM. That's Sec-WebSocket-Protocol
             * For more context: https://github.com/aws-samples/websocket-api-cognito-auth-sample/issues/15#issuecomment-1173401338
             */
            this._socket = new WebSocket(webSocketUrl, token);

            this._socket.onopen = () => {
              this._webSocketStore.setConnected(true);
              this._webSocketStore.setConnecting(false);
              this._sendMessage({
                eventName: eventIdentifier,
                client: true,
                event: 'getLastEvent',
                cms: true,
              });
              console.log('Centralized View WebSocket connection established.');
              this._startPing(eventIdentifier);
            };

            this._socket.onmessage = (event: MessageEvent) => {
              try {
                const parsedMessage: CentralizedViewWebSocketMessage =
                  JSON.parse(event.data);
                console.log('Parsed WebSocket message:', parsedMessage);
                observer.next(parsedMessage);
              } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                this._webSocketStore.setError(
                  'Failed to parse WebSocket message'
                );
                observer.error(error);
              }
            };

            this._socket.onerror = (error: Event) => {
              observer.error('Centralized View WebSocket error: ' + error.type);
            };

            this._socket.onclose = (event: CloseEvent) => {
              console.log(
                'Centralized View WebSocket connection closed:',
                event
              );
              this.disconnect();
              observer.complete();
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
      this._webSocketStore.setConnected(false);
    }
  }

  private _sendMessage(message: CentralizedViewWebSocketOutgoingMessage): void {
    if (this._webSocketStore.$isConnected()) {
      this._socket.send(JSON.stringify(message));
    } else {
      console.error('Centralized View WebSocket is not connected.');
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
              cms: true,
            });
            console.log('Ping sent to keep Centralized View WebSocket alive');
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

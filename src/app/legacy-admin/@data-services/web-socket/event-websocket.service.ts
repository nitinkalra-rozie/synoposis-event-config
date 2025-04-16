import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventWebsocketService implements OnDestroy {
  constructor() {
    this._eventName = this._backendApiService.getCurrentEventName();
  }
  public readonly _sessionLiveListeningSubject = new Subject<any>();
  public readonly _sessionEndSubject = new Subject<any>();
  public readonly sessionLiveListening$ =
    this._sessionLiveListeningSubject.asObservable();
  public readonly sessionEnd$ = this._sessionEndSubject.asObservable();
  public readonly _autoAvToggle = new BehaviorSubject<boolean>(false);
  public readonly autoAvToggle$ = this._autoAvToggle.asObservable();
  private readonly _backendApiService = inject(LegacyBackendApiService);

  private _socket!: WebSocket;
  private _eventName: string;
  private _webSocketUrl: string;
  private _selectedLocation: string = '';
  private _reconnectDelay = 5000; // Delay between reconnection attempts (in ms)
  private _isReconnecting = false; // Prevent multiple reconnection attempts

  initializeWebSocket(selectedLocation: string): void {
    if (!selectedLocation) {
      console.error('Selected location is required to initialize WebSocket.');
      return;
    }

    this._webSocketUrl = `${environment.wsUrl}?eventName=${this._eventName}&stage=${selectedLocation}`;
    this._socket = new WebSocket(this._webSocketUrl);

    this._socket.onopen = () => {
      this._sendMessage({
        eventName: this._eventName,
        client: true,
        event: 'getLastEvent',
        stage: selectedLocation,
      });
      console.log('WebSocket connection established.');
      this._isReconnecting = false;
    };

    this._socket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      this._handleWebSocketMessage(event.data);
    };

    this._socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this._socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      if (this._autoAvToggle.value && !this._isReconnecting) {
        console.log('AutoAV is enabled. Attempting to reconnect...');
        this._isReconnecting = true; // Prevent multiple reconnection attempts
        setTimeout(
          () => this.initializeWebSocket(this._selectedLocation),
          this._reconnectDelay
        );
      }
    };
  }

  closeWebSocket(): void {
    if (this._socket) {
      this._socket.close();
    }
  }

  setAutoAvToggle(state: boolean): void {
    this._autoAvToggle.next(state);
    console.log('AutoAV toggle state updated:', state);
  }

  ngOnDestroy(): void {
    this.closeWebSocket();
  }

  private _sendMessage(message: any): void {
    if (this._socket?.readyState === WebSocket.OPEN) {
      this._socket.send(JSON.stringify(message));
    } else {
      console.error('Event WebSocket is not connected.');
    }
  }

  private _handleWebSocketMessage(message: string): void {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Parsed WebSocket message:', parsedMessage);
      const eventType = parsedMessage.eventType;
      console.log('Event type:', eventType);

      if (eventType === 'SESSION_LIVE_LISTENING') {
        this._sessionLiveListeningSubject.next(parsedMessage);
      } else if (eventType === 'SESSION_END') {
        this._sessionEndSubject.next(parsedMessage);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
}

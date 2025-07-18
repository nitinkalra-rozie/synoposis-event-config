import { Injectable, signal } from '@angular/core';
import { EventStageWebSocketMessageData } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-model';

const state = {
  isConnected: signal<boolean>(false),
  isConnecting: signal<boolean>(false),
  autoAvEnabled: signal<boolean>(false),
  sessionLiveListening: signal<EventStageWebSocketMessageData>(null),
  sessionEnd: signal<EventStageWebSocketMessageData>(null),
  sessionPaused: signal<EventStageWebSocketMessageData>(null),
};

@Injectable({
  providedIn: 'root',
})
export class EventStageWebSocketStateService {
  public readonly $isConnected = state.isConnected.asReadonly();
  public readonly $isConnecting = state.isConnecting.asReadonly();
  public readonly $autoAvEnabled = state.autoAvEnabled.asReadonly();
  public readonly $sessionLiveListening =
    state.sessionLiveListening.asReadonly();
  public readonly $sessionEnd = state.sessionEnd.asReadonly();
  public readonly $sessionPaused = state.sessionPaused.asReadonly();

  setConnected(value: boolean): void {
    state.isConnected.set(value);
  }

  setConnecting(value: boolean): void {
    state.isConnecting.set(value);
  }

  setAutoAvEnabled(value: boolean): void {
    state.autoAvEnabled.set(value);
  }

  setSessionLiveListening(value: EventStageWebSocketMessageData): void {
    state.sessionLiveListening.set(value);
  }

  setSessionEnd(value: EventStageWebSocketMessageData): void {
    state.sessionEnd.set(value);
  }

  setSessionPaused(value: EventStageWebSocketMessageData): void {
    state.sessionPaused.set(value);
  }

  resetState(): void {
    state.isConnected.set(false);
    state.isConnecting.set(false);
    state.autoAvEnabled.set(false);
    state.sessionLiveListening.set(null);
    state.sessionEnd.set(null);
    state.sessionPaused.set(null);
  }
}

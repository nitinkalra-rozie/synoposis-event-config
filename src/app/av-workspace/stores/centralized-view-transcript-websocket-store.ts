import { Injectable, signal } from '@angular/core';

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectedStage: string | null;
  error: string | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  connectedStage: null,
  error: null,
};

const state = {
  isConnected: signal<boolean>(initialState.isConnected),
  isConnecting: signal<boolean>(initialState.isConnecting),
  connectedStage: signal<string | null>(initialState.connectedStage),
  error: signal<string | null>(initialState.error),
};

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewTranscriptWebSocketStore {
  public readonly $isConnected = state.isConnected.asReadonly();
  public readonly $isConnecting = state.isConnecting.asReadonly();
  public readonly $connectedStage = state.connectedStage.asReadonly();
  public readonly $error = state.error.asReadonly();

  setConnected(value: boolean): void {
    state.isConnected.set(value);
  }

  setConnecting(value: boolean): void {
    state.isConnecting.set(value);
  }

  setConnectedStage(value: string | null): void {
    state.connectedStage.set(value);
  }

  setError(value: string | null): void {
    state.error.set(value);
  }

  resetState(): void {
    state.isConnected.set(initialState.isConnected);
    state.isConnecting.set(initialState.isConnecting);
    state.error.set(initialState.error);
  }
}

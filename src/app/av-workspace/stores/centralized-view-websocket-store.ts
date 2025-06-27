import { Injectable, signal } from '@angular/core';

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  error: null,
};

const state = {
  isConnected: signal<boolean>(initialState.isConnected),
  isConnecting: signal<boolean>(initialState.isConnecting),
  error: signal<string | null>(initialState.error),
};

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewWebSocketStore {
  public readonly $isConnected = state.isConnected.asReadonly();
  public readonly $isConnecting = state.isConnecting.asReadonly();
  public readonly $error = state.error.asReadonly();

  setConnected(value: boolean): void {
    state.isConnected.set(value);
  }

  setConnecting(value: boolean): void {
    state.isConnecting.set(value);
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

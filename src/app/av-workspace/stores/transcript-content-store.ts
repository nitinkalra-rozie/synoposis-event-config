import { computed, inject, Injectable, signal } from '@angular/core';
import {
  TranscriptContent,
  TranscriptDisplaySegment,
} from 'src/app/av-workspace/models/transcript-content.model';
import { CentralizedViewTranscriptWebSocketStore } from './centralized-view-transcript-websocket-store';

interface TranscriptState {
  currentTranscript: TranscriptContent | null;
  isLoading: boolean;
}

const initialState: TranscriptState = {
  currentTranscript: null,
  isLoading: false,
};

const state = {
  currentTranscript: signal<TranscriptContent | null>(
    initialState.currentTranscript
  ),
  isLoading: signal<boolean>(initialState.isLoading),
};

@Injectable({
  providedIn: 'root',
})
export class TranscriptContentStore {
  public readonly $vm = computed(() => ({
    transcriptSegments: this._getTranscriptDisplaySegments(),
    hasTranscript: this._getTranscriptDisplaySegments().length > 0,
    showLoadingState: this._webSocketStore.$isConnecting() || state.isLoading(),

    // WebSocket state
    isConnected: this._webSocketStore.$isConnected(),
    isConnecting: this._webSocketStore.$isConnecting(),
    connectionError: this._webSocketStore.$error(),
  }));

  private readonly _webSocketStore = inject(
    CentralizedViewTranscriptWebSocketStore
  );
  private readonly _domParser = new DOMParser();

  updateTranscript(
    sessionId: string,
    stageName: string,
    transcriptText: string,
    timestamp: number
  ): void {
    const existingTranscript = state.currentTranscript();
    const currentTime = Date.now();
    const decodedText = this._decodeHtmlEntities(transcriptText.trim());

    const shouldAppend =
      existingTranscript &&
      existingTranscript.sessionId === sessionId &&
      existingTranscript.stageName === stageName &&
      existingTranscript.fullText.length > 0;

    if (shouldAppend && existingTranscript.timestamp === timestamp) {
      return;
    }

    const fullText = shouldAppend
      ? existingTranscript.fullText + '\n' + decodedText
      : decodedText;

    state.currentTranscript.set({
      sessionId,
      stageName,
      fullText,
      lastUpdated: currentTime,
      isActive: true,
      timestamp,
    });
  }

  clearTranscript(): void {
    state.currentTranscript.set(initialState.currentTranscript);
  }

  setLoading(loading: boolean): void {
    state.isLoading.set(loading);
  }

  private _getTranscriptDisplaySegments(): TranscriptDisplaySegment[] {
    const text = state.currentTranscript()?.fullText || '';
    if (!text.trim()) return [];

    return text
      .split('\n')
      .filter((segment) => segment.trim().length > 0)
      .map((segment, index) => ({
        id: `segment-${index}`,
        text: this._decodeHtmlEntities(segment.trim()),
        index,
        timestamp: state.currentTranscript()?.timestamp || 0,
      }));
  }

  private _decodeHtmlEntities(text: string): string {
    const doc = this._domParser.parseFromString(
      `<!doctype html><body>${text}`,
      'text/html'
    );
    return doc.body.textContent?.replace(/^["']|["']$/g, '') || '';
  }
}

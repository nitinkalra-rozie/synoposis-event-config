export interface CentralizedViewTranscriptWebSocketMessage {
  actionType: 'admin';
  eventType: CentralizedViewTranscriptEventType;
  eventName: string;
  stage: string;
  sessionId: string;
  payload: {
    sessionId: string;
    transcript: string;
    eventName: string;
    eventType: 'SESSION_LIVE_TRANSCRIPT';
    stage: string;
    timestamp: number;
  };
}

export type CentralizedViewTranscriptEventType = 'SESSION_LIVE_TRANSCRIPT';

export interface CentralizedViewTranscriptWebSocketOutgoingMessage {
  eventName: string;
  client: boolean;
  event: string;
}

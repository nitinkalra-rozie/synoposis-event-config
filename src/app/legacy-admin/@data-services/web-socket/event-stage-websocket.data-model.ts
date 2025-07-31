export interface EventStageWebSocketMessageData {
  actionType: string;
  eventType: EventStageWebSocketEventType;
  storeAsEvent: boolean;
  sessionTitle: string;
  eventName: string;
  sessionId: string;
  stage: string;
  status: string;
  autoAv: boolean;
  isProjecting: boolean;
}

export type EventStageWebSocketEventType =
  | 'SESSION_END'
  | 'SESSION_SPEAKERS_BIOS'
  | 'SESSION_LIVE_LISTENING'
  | 'SESSION_LIVE_LISTENING_PAUSED'
  | 'SESSION_LIVE_TRANSCRIPT'
  | 'SET_AUTOAV_SETUP'
  | 'STAGE_STATUS_UPDATED';

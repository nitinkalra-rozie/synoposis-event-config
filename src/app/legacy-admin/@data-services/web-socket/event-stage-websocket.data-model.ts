export interface EventStageWebSocketMessageData {
  actionType: string;
  eventType: EventStageWebSocketEventType;
  storeAsEvent: boolean;
  sessionTitle: string;
  eventName: string;
  sessionId: string;
  stage: string;
}

export type EventStageWebSocketEventType =
  | 'SESSION_END'
  | 'SESSION_SPEAKERS_BIOS'
  | 'SESSION_LIVE_LISTENING';

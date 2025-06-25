export interface CentralizedViewWebSocketMessage {
  actionType: 'admin' | 'messageStage';
  eventType: CentralizedViewEventType;
  storeAsEvent: boolean;
  eventName: string;
  stage: string;
  sessionId?: string;
  autoAv?: boolean;
  actionBy: 'CENTRALIZED_MANAGER' | 'AUTO_AV';
  status?: string; // for STAGE_STATUS_UPDATED
}

export type CentralizedViewEventType =
  | 'SESSION_END'
  | 'SESSION_LIVE_LISTENING_PAUSED'
  | 'SESSION_LIVE_LISTENING'
  | 'SET_AUTOAV_SETUP'
  | 'STAGE_STATUS_UPDATED';

export interface CentralizedViewWebSocketOutgoingMessage {
  eventName: string;
  client: boolean;
  event: string;
  cms: boolean;
}

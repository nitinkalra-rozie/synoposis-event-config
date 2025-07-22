export type SessionStatusType =
  | 'NOT_STARTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type StageStatusType =
  | 'OFFLINE'
  | 'AUDIO_NOT_RECEIVING'
  | 'TRANSCRIPT_NOT_RECEIVING'
  | 'ONLINE'
  | 'ONLINE_AND_PROJECTING';

export type StageActionType =
  | 'SESSION_LIVE_LISTENING'
  | 'SESSION_LIVE_LISTENING_PAUSED'
  | 'SESSION_END';

export interface SpeakerInfo {
  Organization: string;
  isModerator: boolean;
  SpeakerBio: string;
  Title: string;
  Url: string;
  S3FileKey: string;
  Name: string;
}

export interface Session {
  Event: string;
  GenerateInsights: boolean;
  Track: string;
  SessionTitle: string;
  SessionId: string;
  SpeakersInfo: SpeakerInfo[];
  SessionDescription: string;
  Status: SessionStatusType;
  EndsAt: string;
  Type: string;
  PrimarySessionId: string;
  EventDay: string;
  Duration: string;
  Location: string;
  SessionSubject: string;
  StartsAt: string;
  Editor?: string;
}

export interface EventStage {
  stage: string;
  isOnline: boolean;
  status: StageStatusType;
  sessions: readonly Session[];
  autoAv: boolean;
  currentSessionId: string | null;
  currentAction: StageActionType | null;
  lastUpdatedAt: number | null;
  location?: string;
}

export interface EventStagesResponseData {
  success: boolean;
  data: EventStage[];
}

export type EventStagesRequestActionType =
  | 'getStageListWithSessions'
  | 'getSessionListForStage'
  | 'adminStartListening'
  | 'adminEndListening'
  | 'adminPauseListening'
  | 'adminSetAutoAv';

export interface EventStagesRequestData {
  action: EventStagesRequestActionType;
  eventName: string;
}

export interface StageSessionsRequestData extends EventStagesRequestData {
  stage: string;
}

export interface StageSessionsResponseData {
  success: boolean;
  data: Session[];
}

export interface StageProcessSession {
  stage: string;
  sessionId: string;
}

export interface StageSessionActionRequestData extends EventStagesRequestData {
  processStages: StageProcessSession[];
}

export interface StageSessionActionResponseData {
  success: boolean;
  data: {
    message: string;
    results: {
      stage: string;
      sessionId: string;
      success: boolean;
    }[];
  };
}

export interface StageProcessAutoAV {
  stage: string;
  autoAv: boolean;
}

export interface StageAutoAVRequestData extends EventStagesRequestData {
  processStages: StageProcessAutoAV[];
}

export interface StageAutoAVResponseData {
  success: boolean;
  data: {
    message: string;
  };
  results: {
    stage: string;
    autoAv: boolean;
    success: boolean;
  }[];
}

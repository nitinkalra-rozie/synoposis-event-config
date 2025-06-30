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
  status: StageStatusType;
  sessions: readonly Session[];
  autoAv: boolean;
  currentSessionId: string | null;
  currentAction: string | null;
  lastUpdatedAt: number | null;
  location?: string;
}

export interface EventStagesResponseData {
  success: boolean;
  data: EventStage[];
}

export interface EventStagesRequestData {
  action: string;
  eventName: string;
}

export interface StageSessionsRequestData {
  action: string;
  eventName: string;
  stage: string;
}

export interface StageSessionsResponseData {
  success: boolean;
  data: Session[];
}

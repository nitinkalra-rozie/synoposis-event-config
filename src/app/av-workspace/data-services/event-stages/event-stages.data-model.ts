export type SessionStatus =
  | 'NOT_STARTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'COMPLETED';

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
  Status: SessionStatus;
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

export type StageStatus = 'offline' | 'online' | 'projecting';

export interface EventStage {
  stage: string;
  status: StageStatus;
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

export interface EventDetails {
  GenerateInsights: boolean;
  Event: string;
  Track: string;
  SessionTitle: string;
  SessionId: string;
  SpeakersInfo: Array<{
    Title: string;
    Name: string;
  }>;
  SessionDescription: string;
  Status: EventStatus;
  EndsAt: string;
  Type: EventType;
  sid: number;
  PrimarySessionId: string;
  EventDay: string;
  Format: string;
  Location: string;
  SessionSubject: string;
  StartsAt: string;
}

export enum EventStatus {
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
  UnderReview = 'UNDER_REVIEW',
  ReviewComplete = 'REVIEW_COMPLETE',
}

export enum EventType {
  PrimarySession = 'PrimarySession',
  BreakoutSession = 'BreakoutSession',
}

export enum LiveSessionState {
  Playing = 'Playing',
  Paused = 'Paused',
  Stopped = 'Stopped',
}

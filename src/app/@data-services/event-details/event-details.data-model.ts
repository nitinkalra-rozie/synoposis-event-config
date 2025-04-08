import { EventDetailType } from 'src/app/shared/enums';

export interface SessionDetails {
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
  Status: SessionStatus;
  EndsAt: string;
  Type: EventDetailType;
  sid: number;
  PrimarySessionId: string;
  EventDay: string;
  Format: string;
  Location: string;
  SessionSubject: string;
  StartsAt: string;
  EventDomain: string;
}

export interface ProjectionData {
  identifier: string;
  selectedDays: string[];
  selectedTracks: string[];
}

export enum SessionStatus {
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
  Paused = 'PAUSED',
}

export enum LiveSessionState {
  Playing = 'Playing',
  Paused = 'Paused',
  Stopped = 'Stopped',
}

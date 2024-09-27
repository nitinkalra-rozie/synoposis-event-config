import { EventDetailType } from 'src/app/shared/enums';

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
  Type: EventDetailType;
  sid: number;
  PrimarySessionId: string;
  EventDay: string;
  Format: string;
  Location: string;
  SessionSubject: string;
  StartsAt: string;
}

export interface ProjectionData {
  identifier: string;
  selectedDays: string[];
  selectedTracks: string[];
}

export enum EventStatus {
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
  Paused = 'PAUSED',
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

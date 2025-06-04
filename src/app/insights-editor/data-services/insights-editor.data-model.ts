export interface EventReportResponse {
  data?: {
    data?: Array<{
      snapshotData?: string;
    }>;
  };
}

export interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
}

export interface Session {
  EventDay: string;
  SessionTitle: string;
  SessionId: string;
  Track: string;
  Status: EventStatus;
  Location: string;
  StartsAt: string;
  Editor: string;
  Duration: string;
  Type: string;
  Event: string;
  SpeakersInfo: SpeakerInfo[];
}

export interface EmailReportResponse {
  success: boolean;
  message: string;
}

export interface ChangeEventStatusResponse {
  status: string;
  message: string;
}

export interface UpdatePostInsightsResponse {
  updated: boolean;
}

export interface EventDetailsResponse {
  eventName: string;
  sessions: string[];
}

export interface EventReportRequestData {
  action: string;
  sessionIds: string[];
  eventName: string;
}

export interface SpeakerInfo {
  isModerator: boolean;
  Name: string;
}

export interface ChangeEventStatusRequest {
  action: string;
  sessionId: string;
  status: EventStatus;
  changeEditMode: boolean;
  editor: string;
}

export interface UpdatePostInsightsRequest {
  action: string;
  sessionId: string;
  eventName: string;
  domain: string;
  updatedData: DebriefData;
}

export interface DebriefData {
  realtimeinsights: RealtimeInsight[];
  summary: string;
  keytakeaways: string[];
  insights: string[];
  status: EventStatus;
  topics: string[];
  trends: Trend[];
  postInsightTimestamp: string;
  trendsTimestamp: string;
}

export interface Trend {
  title: string;
  description: string;
}

export interface RealtimeInsight {
  Timestamp: string;
  Insights: string[];
}

export interface EventDetail {
  GenerateInsights: boolean;
  Event: string;
  Track: string;
  SessionTitle: string;
  SessionId: string;
  SpeakersInfo: SpeakerInfo[];
  SessionDescription: string;
  Status: EventStatus;
  EndsAt: string;
  Type: string;
  PrimarySessionId: string;
  EventDay: string;
  Duration: string;
  Location: string;
  SessionSubject: string;
  StartsAt: string;
}

export interface EventDetailsResponse {
  success: boolean;
  data: EventDetail[];
  error: string | null;
}

export enum EventStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'Completed',
  REVIEW_COMPLETE = 'REVIEW_COMPLETE',
  // For the statuses array display labels
  NOT_STARTED_LABEL = 'Not started',
  IN_REVIEW_LABEL = 'In review',
  COMPLETE_LABEL = 'Complete',
}

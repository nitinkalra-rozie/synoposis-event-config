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
  Status: string;
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
  status: string;
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
  status: string;
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

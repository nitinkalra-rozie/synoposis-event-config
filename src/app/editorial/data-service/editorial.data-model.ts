export interface EventReportResponse {
  data?: {
    data?: Array<{
      snapshotData?: String; // Replace 'any' with a more specific type if possible
    }>;
  };
}

export interface Application {
  value: string;
  name: string;
}

export interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
}

export interface SelectedConfig {
  type: string;
  application_id: string;
  config: any;
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
  Speakers: any;
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

export interface GenerateContentResponse {
  content: string;
  pdfUrl?: string;
}

export interface GenerateRealtimeInsightsResponse {
  insights: string[];
  summary: string;
}

export interface EventReportRequestData {
  action: string;
  sessionId?: string;
  eventName?: string;
  domain?: string;
  day?: string;
  keyNoteData?: any;
  screenTimeout?: number;
  sessionTitle?: string;
  theme?: string;
  transcript?: string;
  sessionDescription?: string;
  debriefType?: string | null;
  debriefFilter?: string[] | null;
  sessionIds?: string[];
}

export interface SpeakerInfo {
  isModerator: boolean;
  Name: string;
}

export interface SendEmailReportRequest {
  action: 'emailTranscriptReport';
  sessionId: string;
  email: string;
}

export interface ChangeEventStatusRequest {
  action: string;
  sessionId?: string;
  domain?: string;
  status: string;
  changeEditMode?: boolean;
  editor?: string;
}

export interface UpdatePostInsightsRequest {
  action: string;
  sessionId: string;
  eventName: string;
  domain: string;
  updatedData: any;
}

export interface GenerateContentRequest {
  sessionTranscript: string;
  eventId: string;
  sessionTitle: string;
  sessionId: string;
  sessionType: string;
  reportType: string;
  transcriptSource: string;
  promptVersion?: string;
  childSectionSessionIds?: string[];
  speakers?: any;
  generatePDF?: boolean;
}

export interface GenerateRealtimeInsightsRequest {
  action: 'realTimeInsights';
  sessionId: string;
  eventName: string;
  domain: string;
  day: string;
  keyNoteData?: any;
  screenTimeout?: number;
  sessionTitle: string;
  transcript?: string;
  sessionDescription?: string;
}

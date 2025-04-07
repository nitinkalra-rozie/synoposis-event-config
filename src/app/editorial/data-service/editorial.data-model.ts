export interface EventReportResponse {
  data?: {
    data?: Array<{
      snapshotData?: any; // Replace 'any' with a more specific type if possible
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
}

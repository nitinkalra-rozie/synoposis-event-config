export interface TranscriptContent {
  sessionId: string;
  stageName: string;
  fullText: string;
  lastUpdated: number;
  isActive: boolean;
  timestamp: number;
}

export interface TranscriptDisplaySegment {
  id: string;
  text: string;
  index: number;
  timestamp: number;
}

export interface SessionAudioChunk {
  eventName: string;
  sessionId: string;
  chunkBase64: string;
  timestamp: number;
}

export interface AudioRecorderResponse {
  data?: {
    status: string;
    data: {
      message?: string;
      error?: string;
    };
  };
}

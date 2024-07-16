export interface SpeakerInfo {
  isModerator: boolean;
  Name: string;
}

export interface EventDetail {
  Event: string;
  SessionSubject: string;
  EventDay: string;
  SessionTitle: string;
  SessionId: string;
  SpeakersInfo: SpeakerInfo[];
}

export interface PostData {
  action?: string;
  sessionId?: any;
  eventName?: string;
  domain?: string;
  day?: string;
  keyNoteData?: any;
  transcript?: string;
  screenTimeout?: number;
  sessionTitle?: string;
  theme?: string;
}

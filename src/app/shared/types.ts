import { EventDetailType } from './enums';

export interface SpeakerInfo {
  isModerator: boolean;
  Name: string;
}

export interface BreakoutSession {
  SessionId: string;
  SessionTitle: string;
  SpeakersInfo: SpeakerInfo[];
}

export interface EventDetail {
  Event: string;
  SessionSubject: string;
  EventDay: string;
  SessionTitle: string;
  SessionId: string;
  SpeakersInfo: SpeakerInfo[];

  PrimarySessionId: string;
  Type: EventDetailType;
  // BreakoutSessions?: BreakoutSession[]; 
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
  primarySessionId?: any;
}
export interface AuthResponse {
  data: any;
  AuthenticationResult: {
    AccessToken: string;
    ExpiresIn: number;
    IdToken: string;
    RefreshToken: string;
    TokenType: string;
  };
  ChallengeParameters: {};
}
export interface CognitoError extends Error {
  code: string;
}

export interface CustomChallengeResponse {
  __type?: string;
  Session?: string;
}
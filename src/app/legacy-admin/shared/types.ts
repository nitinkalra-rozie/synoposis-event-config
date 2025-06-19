import { AuthTokens } from 'aws-amplify/auth';
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
  SessionDescription: string;
  SessionId: string;
  SpeakersInfo: SpeakerInfo[];

  PrimarySessionId: string;
  Type: EventDetailType;
  GenerateInsights: boolean;
  sid: number;
  // BreakoutSessions?: BreakoutSession[];

  Track: string;
  Location: string;
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
  sessionDescription?: string;
  debriefFilter?: string[];
  debriefType?: string;
  sessionIds?: string[];
  stage?: string;
}

export interface AuthResponse {
  AuthenticationResult: {
    AccessToken: string;
    IdToken: string;
    RefreshToken: string;
  };
}

export interface CustomChallengeResponse {
  success: boolean;
  message: string;
}

export interface AuthSession {
  tokens: AuthTokens | null;
  user: any;
  timestamp: number;
}

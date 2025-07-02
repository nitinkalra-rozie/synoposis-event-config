import { AuthTokens } from 'aws-amplify/auth';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export interface RoutePermission {
  path: string;
  roles: UserRole[];
}

export interface CustomChallengeResponse {
  success: boolean;
  message: string;
}

export interface AuthSession {
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  lastFetched: number;
}

export interface TokenRefreshError {
  type:
    | 'REFRESH_TOKEN_EXPIRED'
    | 'UNAUTHENTICATED'
    | 'UNAUTHORIZED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  originalError: any;
  message: string;
  isRetryable: boolean;
}

export interface TokenRefreshAttempt {
  attemptNumber: number;
  maxAttempts: number;
  error: TokenRefreshError;
  nextRetryDelayMs?: number;
}

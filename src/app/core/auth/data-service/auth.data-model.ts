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
  user: any;
  timestamp: number;
}

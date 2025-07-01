import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import {
  AuthSession,
  CustomChallengeResponse,
} from 'src/app/core/auth/models/auth.model';
import { AuthRoleService } from 'src/app/core/auth/services/auth-role';
import { AuthSessionService } from 'src/app/core/auth/services/auth-session';
import { AuthTokenService } from 'src/app/core/auth/services/auth-token';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly _authSessionService = inject(AuthSessionService);
  private readonly _authTokenService = inject(AuthTokenService);
  private readonly _authRoleService = inject(AuthRoleService);

  signUp$(email: string): Observable<CustomChallengeResponse> {
    return this._authSessionService.signUp$(email);
  }

  verifyOTP$(otp: string): Observable<boolean> {
    return this._authSessionService.OTPVerification$(otp);
  }
  resendOtp$(email: string): Observable<CustomChallengeResponse> {
    return this._authSessionService.resendOtp$(email);
  }

  logout$(): Observable<void> {
    return this._authSessionService.logout$();
  }

  getAccessToken$(): Observable<string | null> {
    return this._authTokenService.getAccessToken$();
  }

  getUserRole$(): Observable<UserRole | null> {
    return this._authRoleService.getUserRole$();
  }

  isUserAdmin$(): Observable<boolean> {
    return this._authRoleService.isUserAdmin$();
  }

  checkSession$(): Observable<AuthSession> {
    return this._authSessionService.checkSession$();
  }

  getUserEmail$(): Observable<string | null> {
    return this._authSessionService.getUserEmail$();
  }

  getValidToken$(): Observable<string> {
    return this._authTokenService.getValidToken$();
  }

  isAuthenticated$(): Observable<boolean> {
    return this._authTokenService.isAuthenticated$();
  }
}

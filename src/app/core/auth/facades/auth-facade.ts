import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import {
  AuthSession,
  CustomChallengeResponse,
} from 'src/app/core/auth/models/auth.model';
import { AuthRoleService } from 'src/app/core/auth/services/auth-role';
import { AuthSessionService } from 'src/app/core/auth/services/auth-session';
import { AuthTokenService } from 'src/app/core/auth/services/auth-token';
import { AuthStore } from 'src/app/core/auth/stores/auth-store';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private readonly _sessionService = inject(AuthSessionService);
  private readonly _tokenService = inject(AuthTokenService);
  private readonly _authRoleService = inject(AuthRoleService);
  private readonly _authStore = inject(AuthStore);

  signUp(email: string): Observable<CustomChallengeResponse> {
    return this._sessionService.signUp(email);
  }

  verifyOTP(otp: string): Observable<boolean> {
    return this._sessionService.OTPVerification(otp);
  }
  resendOtp(email: string): Observable<CustomChallengeResponse> {
    return this._sessionService.resendOtp(email);
  }

  logout(): Observable<void> {
    return this._sessionService.logout$();
  }

  getAccessToken$(): Observable<string | null> {
    return this._tokenService.getAccessToken$();
  }

  getUserRole$(): Observable<UserRole | null> {
    return this._authRoleService.getUserRole$();
  }

  isUserAdmin$(): Observable<boolean> {
    return this._authRoleService.isUserAdmin$();
  }

  checkSession$(): Observable<AuthSession> {
    return this._sessionService.checkSession$();
  }

  getUserEmail$(): Observable<string | null> {
    return this._sessionService.getUserEmail$();
  }

  getValidToken$(): Observable<string> {
    return this._tokenService.getValidToken$();
  }

  isAuthenticated(): Observable<boolean> {
    return this._tokenService.isAuthenticated();
  }
}

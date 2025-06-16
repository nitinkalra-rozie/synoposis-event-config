import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Amplify } from 'aws-amplify';
import {
  confirmSignIn,
  fetchAuthSession,
  signIn,
  SignInInput,
  SignInOutput,
} from 'aws-amplify/auth';
import { from, map, Observable, switchMap, tap } from 'rxjs';
import {
  AUTH_FLOW_TYPES,
  SIGN_IN_STEPS,
} from 'src/app/core/auth/constants/auth-constants';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { CustomChallengeResponse } from 'src/app/legacy-admin/shared/types';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  constructor() {
    if (!Amplify.getConfig().Auth?.Cognito) {
      Amplify.configure(amplifyConfig);
    }
  }

  private readonly _http = inject(HttpClient);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authService = inject(AuthService);

  signUp(email: string): Observable<CustomChallengeResponse> {
    return from(fetchAuthSession()).pipe(
      takeUntilDestroyed(this._destroyRef),
      switchMap((session) => {
        if (session.tokens?.accessToken) {
          return [
            {
              success: true,
              message: 'User already signed in',
            } satisfies CustomChallengeResponse,
          ];
        }
        return this.performSignIn(email);
      })
    );
  }

  OTPVerification(otp: string): Observable<boolean> {
    return from(confirmSignIn({ challengeResponse: otp })).pipe(
      takeUntilDestroyed(this._destroyRef),
      map((result: SignInOutput) => result.isSignedIn),
      tap((isSignedIn) => {
        if (isSignedIn) {
          this._authService.initializeTokenRefreshScheduling();
        }
      })
    );
  }

  resendOtp(email: string): Observable<CustomChallengeResponse> {
    return this.performSignIn(email).pipe(takeUntilDestroyed(this._destroyRef));
  }

  requestAccess(
    email: string,
    additionalHeaders?: Record<string, string>
  ): Observable<boolean> {
    const requestBody = { email };
    const baseUrl = this._getRequestAccessBaseUrl();

    const methodHeaders = {
      'x-api-key': environment.REQUEST_ACCESS_API_KEY || '',
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    return from(fetchAuthSession()).pipe(
      map((session) => {
        const token = session.tokens?.accessToken?.toString() || '';

        const allHeaders = {
          ...methodHeaders,
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        return new HttpHeaders(allHeaders);
      }),
      switchMap((headers) =>
        this._http.post<{ status: number }>(`${baseUrl}/`, requestBody, {
          headers,
        })
      ),
      takeUntilDestroyed(this._destroyRef),
      map((response) => response.status === 200)
    );
  }

  private performSignIn(email: string): Observable<CustomChallengeResponse> {
    const signInInput: SignInInput = {
      username: email,
      options: {
        authFlowType: AUTH_FLOW_TYPES.CUSTOM_WITHOUT_SRP,
      },
    };

    return from(signIn(signInInput)).pipe(
      map((result: SignInOutput) => {
        if (result.isSignedIn) {
          return {
            success: true,
            message: 'User signed in successfully',
          } satisfies CustomChallengeResponse;
        }

        if (
          result.nextStep?.signInStep ===
          SIGN_IN_STEPS.CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE
        ) {
          return {
            success: true,
            message: 'OTP sent successfully',
          } satisfies CustomChallengeResponse;
        }

        return {
          success: false,
          message: 'Unexpected authentication flow',
        } satisfies CustomChallengeResponse;
      })
    );
  }

  private _getRequestAccessBaseUrl = (): string =>
    environment.REQUEST_ACCESS_API || '';
}

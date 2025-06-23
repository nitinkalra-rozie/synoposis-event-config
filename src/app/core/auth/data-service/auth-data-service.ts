import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  confirmSignIn,
  signIn,
  SignInInput,
  SignInOutput,
} from 'aws-amplify/auth';
import { from, map, Observable, of, switchMap } from 'rxjs';
import {
  AUTH_FLOW_TYPES,
  SIGN_IN_STEPS,
} from 'src/app/core/auth/constants/auth-constants';
import { CustomChallengeResponse } from 'src/app/core/auth/data-service/auth-data-model';
import { AuthStore } from 'src/app/core/auth/services/auth-store';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private readonly _http = inject(HttpClient);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authStore = inject(AuthStore);

  signUp(email: string): Observable<CustomChallengeResponse> {
    const cachedSession = this._authStore.getCachedSession();

    if (cachedSession?.tokens?.accessToken) {
      return of({
        success: true,
        message: 'User already signed in',
      } satisfies CustomChallengeResponse);
    }

    return this._authStore.refreshSession$().pipe(
      takeUntilDestroyed(this._destroyRef),
      switchMap((session) => {
        if (session.tokens?.accessToken) {
          return of({
            success: true,
            message: 'User already signed in',
          } satisfies CustomChallengeResponse);
        }
        return this.performSignIn(email);
      })
    );
  }

  OTPVerification(otp: string): Observable<boolean> {
    return from(confirmSignIn({ challengeResponse: otp })).pipe(
      takeUntilDestroyed(this._destroyRef),
      map((result: SignInOutput) => {
        if (result.isSignedIn) {
          this._authStore.refreshSession$().subscribe();
        }
        return result.isSignedIn;
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

    return this._authStore.getAccessToken$().pipe(
      map((token) => {
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
          this._authStore.refreshSession$().subscribe();

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

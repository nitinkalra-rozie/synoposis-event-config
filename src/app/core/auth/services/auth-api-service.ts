import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Amplify } from 'aws-amplify';
import {
  confirmSignIn,
  resendSignUpCode,
  signIn,
  SignInInput,
  SignInOutput,
} from 'aws-amplify/auth';
import { catchError, from, map, Observable, of, throwError } from 'rxjs';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { CustomChallengeResponse } from 'src/app/legacy-admin/shared/types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  constructor() {
    if (!Amplify.getConfig().Auth?.Cognito) {
      Amplify.configure(amplifyConfig);
    }
  }
  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _baseUrl = signal(environment.AUTH_API_END_POINT || '');
  private readonly _customHeaders = signal<Record<string, string>>({});

  private readonly _headers = computed(() => {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token,
      ...this._customHeaders(),
    });
  });

  updateBaseUrl(url: string): void {
    this._baseUrl.set(url);
  }

  updateHeaders(headers: Record<string, string>): void {
    this._customHeaders.set({ ...headers });
  }

  signUp(email: string): Observable<CustomChallengeResponse> {
    const signInInput: SignInInput = {
      username: email,
      options: {
        authFlowType: 'CUSTOM_WITHOUT_SRP',
      },
    };

    return from(signIn(signInInput)).pipe(
      takeUntilDestroyed(this._destroyRef),
      map((result: SignInOutput) => {
        if (result.isSignedIn) {
          return {
            success: true,
            message: 'User signed in successfully',
          } satisfies CustomChallengeResponse;
        }

        if (
          result.nextStep?.signInStep ===
          'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE'
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
      }),
      catchError((error) => {
        console.error('Error during signUp:', error);
        return of({
          success: false,
          message: 'Authentication failed. Please try again.',
        } satisfies CustomChallengeResponse);
      })
    );
  }

  OTPVerification(email: string, otp: string): Observable<boolean> {
    return from(confirmSignIn({ challengeResponse: otp })).pipe(
      takeUntilDestroyed(this._destroyRef),
      map((result: SignInOutput) => result.isSignedIn)
    );
  }

  resendOtp(email: string): Observable<void> {
    return from(resendSignUpCode({ username: email })).pipe(
      takeUntilDestroyed(this._destroyRef),
      map(() => void 0),
      catchError(() =>
        this.signUp(email).pipe(
          map(() => void 0),
          catchError((signInError) => throwError(() => signInError))
        )
      )
    );
  }

  requestAccess(email: string): Observable<boolean> {
    const requestBody = { email };
    this.updateBaseUrl(environment.REQUEST_ACCESS_API || '');
    this.updateHeaders({
      'x-api-key': environment.REQUEST_ACCESS_API_KEY || '',
      'Content-Type': 'application/json',
    });

    return this._http
      .post<{ status: number }>(`${this._baseUrl()}/`, requestBody, {
        headers: this._headers(),
      })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((response) => response.status === 200)
      );
  }
}

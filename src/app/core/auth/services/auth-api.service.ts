import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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
import { normalizeParams } from 'src/app/legacy-admin/@utils/http-utils';
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
  private _baseUrl = environment.AUTH_API_END_POINT || '';
  private _customHeaders: Record<string, string> = {};

  updateBaseUrl(url: string): void {
    this._baseUrl = url;
  }

  updateHeaders(headers: Record<string, string>): void {
    this._customHeaders = { ...headers };
  }

  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    return this._http.get<T>(this._baseUrl + endpoint, {
      headers: this.getHeaders(),
      params: this.createHttpParams(params),
    });
  }

  post<T>(
    endpoint: string,
    body: Record<string, any>,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    return this._http.post<T>(this._baseUrl + endpoint, body, {
      headers: this.getHeaders(),
      params: this.createHttpParams(params),
    });
  }

  put<T>(
    endpoint: string,
    body: Record<string, any>,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    return this._http.put<T>(this._baseUrl + endpoint, body, {
      headers: this.getHeaders(),
      params: this.createHttpParams(params),
    });
  }

  delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    return this._http.delete<T>(this._baseUrl + endpoint, {
      headers: this.getHeaders(),
      params: this.createHttpParams(params),
    });
  }

  signUp(email: string): Observable<CustomChallengeResponse> {
    const signInInput: SignInInput = {
      username: email,
      options: {
        authFlowType: 'CUSTOM_WITHOUT_SRP',
      },
    };

    return from(signIn(signInInput)).pipe(
      map((result: SignInOutput) => {
        if (result.isSignedIn) {
          return {
            success: true,
            message: 'User signed in successfully',
          } as CustomChallengeResponse;
        }

        if (
          result.nextStep?.signInStep ===
          'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE'
        ) {
          return {
            success: true,
            message: 'OTP sent successfully',
          } as CustomChallengeResponse;
        }

        return {
          success: false,
          message: 'Unexpected authentication flow',
        } as CustomChallengeResponse;
      }),
      catchError(() =>
        of({
          success: false,
          message: 'Authentication failed. Please try again.',
        } as CustomChallengeResponse)
      )
    );
  }

  OTPVerification(email: string, otp: string): Observable<boolean> {
    return from(confirmSignIn({ challengeResponse: otp })).pipe(
      map((result: SignInOutput) => result.isSignedIn)
    );
  }

  resendOtp(email: string): Observable<void> {
    return from(resendSignUpCode({ username: email })).pipe(
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

    return from(this.post<{ status: number }>('/', requestBody)).pipe(
      map((response) => response.status === 200)
    );
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token,
      ...this._customHeaders,
    });
  }

  private createHttpParams(
    params?: Record<string, string | number | boolean>
  ): HttpParams {
    return new HttpParams({
      fromObject: normalizeParams(params || {}),
    });
  }
}

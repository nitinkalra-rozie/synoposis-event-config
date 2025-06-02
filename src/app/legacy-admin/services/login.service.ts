import { Injectable } from '@angular/core';
import { Amplify } from 'aws-amplify';
import { signUp } from 'aws-amplify/auth';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { environment } from 'src/environments/environment';
import {
  AuthResponse,
  CognitoError,
  CustomChallengeResponse,
} from '../shared/types';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authApiService: AuthApiService,
    private authService: AuthService
  ) {
    if (!Amplify.getConfig().Auth?.Cognito) {
      Amplify.configure(amplifyConfig);
    }
  }

  signUp(email: string): Observable<any> {
    const clientMetadata = {
      domain: window.location.hostname,
    };

    return from(
      signUp({
        username: email,
        password: 'TempPassword123!',
        options: {
          userAttributes: {
            email: email,
            'custom:domain': window.location.hostname,
          },
          clientMetadata: clientMetadata,
        },
      })
    ).pipe(
      switchMap((result) => {
        console.log('User signed up:', result.userId);
        return this.callCustomChallengeAPI(email);
      }),
      catchError((error) => {
        console.log('SignUp error:', error);
        if (error.name === 'UsernameExistsException') {
          return this.callCustomChallengeAPI(email);
        } else {
          console.error('Error signing up user:', error);
          throw error;
        }
      })
    );
  }

  callCustomChallengeAPI(email: string): Observable<CustomChallengeResponse> {
    const requestBody = {
      AuthParameters: {
        USERNAME: email,
        CHALLENGE_NAME: 'CUSTOM_CHALLENGE',
      },
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: environment.USER_POOL_WEB_CLIENT_ID,
    };

    this.authApiService.updateBaseUrl(environment.AUTH_API_END_POINT || '');
    this.authApiService.updateHeaders({
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      'Content-Type': 'application/x-amz-json-1.1',
    });

    return from(
      this.authApiService.post<CustomChallengeResponse>('/', requestBody)
    ).pipe(
      map((response) => {
        // Ensure the response adheres to CustomChallengeResponse
        if (response.__type !== 'NotAuthorizedException') {
          const sessionToken = response.Session;
          localStorage.setItem('sessionToken', sessionToken);
          return {
            success: true,
            message: '',
          } as CustomChallengeResponse;
        } else {
          return {
            success: false,
            message: `Sorry, seems like we don't have your email address in our database`,
          } as CustomChallengeResponse;
        }
      }),
      catchError((error) => {
        const cognitoError = error as CognitoError;
        console.error('Error calling custom challenge API:', cognitoError);
        return from(
          Promise.resolve({
            success: false,
            message:
              'This email is not enabled. Please connect with us at hello@rozie.ai to get the access.',
          } as CustomChallengeResponse)
        );
      })
    );
  }

  OTPVerification(email: string, otp: string): Observable<AuthResponse | null> {
    const requestBody = {
      ChallengeName: 'CUSTOM_CHALLENGE',
      ChallengeResponses: {
        USERNAME: email,
        ANSWER: otp,
      },
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: environment.USER_POOL_WEB_CLIENT_ID,
      Session: localStorage.getItem('sessionToken'),
    };

    this.authApiService.updateBaseUrl(environment.AUTH_API_END_POINT || '');
    this.authApiService.updateHeaders({
      'X-Amz-Target':
        'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
      'Content-Type': 'application/x-amz-json-1.1',
    });

    return from(this.authApiService.post<AuthResponse>('/', requestBody)).pipe(
      map((response) => {
        if (
          response.AuthenticationResult &&
          response.AuthenticationResult.AccessToken
        ) {
          this.authService.saveAuthInLocal(response);

          const sessionToken = response.AuthenticationResult.RefreshToken;
          localStorage.setItem('sessionToken', sessionToken);

          return response;
        } else {
          console.error(
            'Error calling OTP Verification API. Response:',
            response
          );
          return null;
        }
      }),
      catchError((error) => {
        console.error('Error calling OTP Verification API:', error);
        return from(Promise.resolve(null));
      })
    );
  }

  requestAccess(email: string): Observable<boolean> {
    const requestBody = { email };
    this.authApiService.updateBaseUrl(environment.REQUEST_ACCESS_API || '');
    this.authApiService.updateHeaders({
      'x-api-key': environment.REQUEST_ACCESS_API_KEY || '',
      'Content-Type': 'application/json',
    });

    return from(
      this.authApiService.post<{ status: number }>('/', requestBody)
    ).pipe(
      map((response) => response.status === 200),
      catchError((error) => {
        console.error('Error sending request for access:', error);
        return from(Promise.resolve(false));
      })
    );
  }

  resendOtp(email: string): Observable<void> {
    return new Observable<void>((observer) => {
      try {
        console.log('Inside resendOtp, email:', email);
        this.signUp(email)
          .pipe(
            switchMap(() => {
              observer.next();
              observer.complete();
              return new Observable<void>((obs) => obs.complete());
            }),
            catchError((error) => {
              console.error('Error in signUp:', error);
              observer.error(error);
              return throwError(error);
            })
          )
          .subscribe();
      } catch (error) {
        console.error('Error in resendOtp:', error);
        observer.error(error);
      }
    }).pipe(catchError((error) => throwError(error)));
  }
}

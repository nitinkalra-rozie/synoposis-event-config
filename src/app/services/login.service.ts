// src/app/services/login.service.ts

import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  AuthResponse,
  CognitoError,
  CustomChallengeResponse,
} from '../shared/types';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
// TODO: update to use Amplify v6. means aws-amplify@6.*.*
// Check - https://www.npmjs.com/package/amazon-cognito-identity-js
import {
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

const poolData = {
  UserPoolId: environment.USER_POOL_ID, // Your user pool id here
  ClientId: environment.USER_POOL_WEB_CLIENT_ID, // Your client id here
};

const userPool = new CognitoUserPool(poolData);

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authApiService: AuthApiService,
    private authService: AuthService
  ) {}

  signUp(email: string): Observable<any> {
    const attributeList: CognitoUserAttribute[] = [];
    const dataEmail = {
      Name: 'email',
      Value: email,
    };
    const attributeEmail = new CognitoUserAttribute(dataEmail);

    attributeList.push(attributeEmail);

    const clientMetadata = {
      domain: window.location.hostname,
    };

    return new Observable((observer) => {
      userPool.signUp(
        email,
        'TempPassword123!',
        attributeList,
        [],
        async (err, result) => {
          if (err) {
            const error = err as CognitoError;
            if (error.code === 'UsernameExistsException') {
              try {
                const challengeResult =
                  await this.callCustomChallengeAPI(email).toPromise();
                observer.next(challengeResult);
                observer.complete();
              } catch (challengeErr) {
                observer.error(challengeErr);
              }
            } else {
              console.error('Error signing up user:', err);
              observer.error(err);
            }
          } else {
            const cognitoUser = result.user;
            console.log('User name is ' + cognitoUser.getUsername());

            try {
              const challengeResult =
                await this.callCustomChallengeAPI(email).toPromise();
              observer.next(challengeResult);
              observer.complete();
            } catch (challengeErr) {
              observer.error(challengeErr);
            }
          }
        },
        clientMetadata
      );
    }).pipe(
      catchError((error) => {
        console.error('Error in signUp:', error);
        return from(Promise.reject(error));
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
          } as CustomChallengeResponse; // Type assertion
        } else {
          return {
            success: false,
            message: `Sorry, seems like we don't have your email address in our database`,
          } as CustomChallengeResponse; // Type assertion
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
        ); // Type assertion
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

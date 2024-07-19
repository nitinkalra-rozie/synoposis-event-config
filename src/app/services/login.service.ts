// src/app/services/login.service.ts

import { Injectable } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { AuthResponse, CustomChallengeResponse, CognitoError } from '../shared/types';
import { environment } from 'src/environments/environment';
import { CognitoUser, CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';
import Toastify from 'toastify-js';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

    return new Observable(observer => {
      userPool.signUp(email, 'TempPassword123!', attributeList, [], async (err, result) => {
        if (err) {
          const error = err as CognitoError;
          if (error.code === 'UsernameExistsException') {
            try {
              const challengeResult = await this.callCustomChallengeAPI(email).toPromise();
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
            const challengeResult = await this.callCustomChallengeAPI(email).toPromise();
            observer.next(challengeResult);
            observer.complete();
          } catch (challengeErr) {
            observer.error(challengeErr);
          }
        }
      });
    }).pipe(
      catchError(error => {
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

    return from(this.authApiService.post<CustomChallengeResponse>('/', requestBody)).pipe(
      map(response => {
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
            message: "Sorry, seems like we don't have your email address in our database",
          } as CustomChallengeResponse; // Type assertion
        }
      }),
      catchError(error => {
        const cognitoError = error as CognitoError;
        console.error('Error calling custom challenge API:', cognitoError);
        return from(
          Promise.resolve({
            success: false,
            message: 'Email is not yet verified',
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
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
      'Content-Type': 'application/x-amz-json-1.1',
    });

    return from(this.authApiService.post<AuthResponse>('/', requestBody)).pipe(
      map(response => {
        if (response.AuthenticationResult && response.AuthenticationResult.IdToken) {
          this.authService.saveAuthInLocal(response);
          return response;
        } else {
          Toastify({
            text: 'Can you please verify the OTP again?',
            backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)',
          }).showToast();
          console.error('Error calling custom challenge API. Response:', response);
          return null;
        }
      }),
      catchError(error => {
        console.error('Error calling custom challenge API:', error);
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

    return from(this.authApiService.post<{ status: number }>('/', requestBody)).pipe(
      map(response => response.status === 200),
      catchError(error => {
        console.error('Error sending request for access:', error);
        return from(Promise.resolve(false));
      })
    );
  }

  resendOtp(email: string): Observable<void> {
    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    return new Observable(observer => {
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          const cognitoError = err as CognitoError;
          console.error('Error resending OTP:', cognitoError);
          observer.error(cognitoError);
        } else {
          console.log('OTP resent successfully:', result);
          observer.next();
          observer.complete();
        }
      });
    });
  }
}

import { Injectable } from '@angular/core';
// TODO: update to use Amplify v6. means aws-amplify@6.*.*
// Check - https://www.npmjs.com/package/amazon-cognito-identity-js
import {
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { AuthResponse } from '../shared/types';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router) {
    this._userPool = new CognitoUserPool({
      UserPoolId: environment.USER_POOL_ID,
      ClientId: environment.USER_POOL_WEB_CLIENT_ID,
    });
  }

  private _userPool: CognitoUserPool;
  private _navigateFunction: ((path: string) => void) | null = null;

  public setNavigateFunction = (navigate: (path: string) => void): void => {
    this._navigateFunction = navigate;
  };

  public saveAuthInLocal = async (data: AuthResponse): Promise<void> => {
    const {
      AuthenticationResult: { AccessToken, IdToken, RefreshToken },
    } = data;
    console.log('auth data1 ', data.AuthenticationResult);
    localStorage.setItem('accessToken', AccessToken);
    localStorage.setItem('idToken', IdToken);
    localStorage.setItem('refreshToken', RefreshToken);
  };

  public logout = (): void => {
    const cognitoUser = this._userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionToken');
    this.router.navigate(['/login']);
  };

  public isAuthenticated = (): boolean => {
    const cognitoUser = localStorage.getItem('idToken');
    return cognitoUser !== null;
  };

  public getAccessToken = (): string | null =>
    localStorage.getItem('accessToken');

  public getIdToken = (): string | null => localStorage.getItem('idToken');

  public getRefreshToken = (): string | null =>
    localStorage.getItem('refreshToken');

  public checkSession = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const cognitoUser = this._userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.getSession((err: any, session: CognitoUserSession) => {
          if (err) {
            this.logout();
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        this.logout();
        reject(new Error('No user session available'));
      }
    });

  // public refreshAccessToken = async (): Promise<string> => {
  //   return new Promise((resolve, reject) => {
  //     const cognitoUser = this.userPool.getCurrentUser();
  //     if (cognitoUser) {
  //       const refreshTokenString = this.getRefreshToken();
  //       if (refreshTokenString) {
  //         const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenString });
  //         cognitoUser.refreshSession(refreshToken, (err, session: CognitoUserSession) => {
  //           if (err) {
  //             this.logout();
  //             reject(err);
  //           } else {
  //             const newAccessToken = session.getAccessToken().getJwtToken();
  //             localStorage.setItem('accessToken', newAccessToken);
  //             resolve(newAccessToken);
  //           }
  //         });
  //       } else {
  //         this.logout();
  //         reject(new Error('No refresh token available'));
  //       }
  //     } else {
  //       this.logout();
  //       reject(new Error('No user session available'));
  //     }
  //   });
  // };
}

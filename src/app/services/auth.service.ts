import { Injectable } from '@angular/core';
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserSession,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';
import { AuthResponse } from '../shared/types';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static instance: AuthService;
  private userPool: CognitoUserPool;
  private navigateFunction: ((path: string) => void) | null = null;

    constructor(private router: Router,) {
    this.userPool = new CognitoUserPool({
      UserPoolId: environment.USER_POOL_ID,
      ClientId: environment.USER_POOL_WEB_CLIENT_ID,
    });
  }

  public setNavigateFunction = (navigate: (path: string) => void): void => {
    this.navigateFunction = navigate;
  };

  public saveAuthInLocal = async (data: AuthResponse): Promise<void> => {
    const {
      AuthenticationResult: { AccessToken, IdToken, RefreshToken },
    } = data;
    console.log("auth data1 ",data.AuthenticationResult);
    localStorage.setItem('accessToken', AccessToken);
    localStorage.setItem('idToken', IdToken);
    localStorage.setItem('refreshToken', RefreshToken);
  };

  public logout = (): void => {
    const cognitoUser = this.userPool.getCurrentUser();
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

  public getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  public getIdToken = (): string | null => {
    return localStorage.getItem('idToken');
  };

  public getRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken');
  };

  public checkSession = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
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
  };

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

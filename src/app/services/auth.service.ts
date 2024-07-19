import { Injectable } from '@angular/core';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';
import { AuthResponse } from '../shared/types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static instance: AuthService;
  private userPool: CognitoUserPool;
  private navigateFunction: ((path: string) => void) | null = null;

  private constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: environment.USER_POOL_ID,
      ClientId: environment.USER_POOL_WEB_CLIENT_ID,
    });
  }

  public static getInstance = (): AuthService => {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  };

  public setNavigateFunction = (navigate: (path: string) => void): void => {
    this.navigateFunction = navigate;
  };

  public saveAuthInLocal = async (data: AuthResponse): Promise<void> => {
    const {
      AuthenticationResult: { AccessToken, IdToken, RefreshToken },
    } = data;
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
    if (this.navigateFunction) {
      this.navigateFunction('/login'); // Navigate to login page
    }
  };

  public isAuthenticated = (): boolean => {
    const cognitoUser = this.userPool.getCurrentUser();
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

  public refreshAccessToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (cognitoUser) {
        const refreshTokenString = this.getRefreshToken();
        if (refreshTokenString) {
          const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenString });
          cognitoUser.refreshSession(refreshToken, (err, session: CognitoUserSession) => {
            if (err) {
              this.logout(); // Use stored navigate function
              reject(err);
            } else {
              const newAccessToken = session.getAccessToken().getJwtToken();
              localStorage.setItem('accessToken', newAccessToken);
              resolve(newAccessToken);
            }
          });
        } else {
          this.logout(); // Use stored navigate function
          reject(new Error('No refresh token available'));
        }
      } else {
        this.logout(); // Use stored navigate function
        reject(new Error('No user session available'));
      }
    });
  };
}

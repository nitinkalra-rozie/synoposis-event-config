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
import { jwtDecode } from 'jwt-decode';
import { UserRole } from '../shared/enums';
import { RoleRank } from '../shared/constants';
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
    const cognitoUser = localStorage.getItem('accessToken');
    return cognitoUser !== null;
  };

  public getUserEmail = (): string | null => localStorage.getItem('userEmail');

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

  public getUserGroups = (): string[] | null => {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      console.error('Access token not found');
      return null;
    }

    try {
      const decodedToken: any = jwtDecode(accessToken);
      const userGroups = decodedToken['cognito:groups']; // Get groups from the token
      console.log('User groups:', userGroups);
      return userGroups || null;
    } catch (error) {
      console.error('Error decoding access token:', error);
      return null;
    }
  };

  public getUserRole = (): UserRole => {
    try {
      const accessToken = this.getAccessToken();
      const decodedToken: any = jwtDecode(accessToken);
      const email = decodedToken.email || decodedToken.username;
      if (email && email.endsWith('@rozie.ai')) {
        return UserRole.SUPERADMIN;
      }
      const groups = this.getUserGroups();
      if (groups.some((group) => group.includes('SUPER_ADMIN'))) {
        return UserRole.SUPERADMIN;
      } else if (groups.some((group) => group.includes('ADMIN'))) {
        return UserRole.ADMIN;
      } else {
        return UserRole.EDITOR;
      }
    } catch (error) {
      console.error('Error decoding access token:', error);
      return UserRole.EDITOR;
    }
  };

  public getUserRoleRank = (): number => {
    const role = this.getUserRole();
    switch (role) {
      case UserRole.SUPERADMIN:
        return RoleRank.SUPER_ADMIN;
      case UserRole.ADMIN:
        return RoleRank.ADMIN;
      default:
        return RoleRank.EDITOR;
    }
  };
}

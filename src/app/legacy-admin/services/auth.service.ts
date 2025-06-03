import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { interval } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';
import { AuthResponse } from '../shared/types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {
    Amplify.configure(amplifyConfig);
    this.startTokenCheck();
  }

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  private readonly _tokenKey = 'auth_token';
  private readonly _tokenCheckIntervalMs = 60000;

  private _destroyRef = inject(DestroyRef);
  private _navigateFunction: ((path: string) => void) | null = null;
  private _tokenCheckInterval: any;

  public setNavigateFunction = (navigate: (path: string) => void): void => {
    this._navigateFunction = navigate;
  };

  public saveAuthInLocal = async (data: AuthResponse): Promise<void> => {
    const {
      AuthenticationResult: { AccessToken, IdToken, RefreshToken },
    } = data;
    localStorage.setItem('accessToken', AccessToken);
    localStorage.setItem('idToken', IdToken);
    localStorage.setItem('refreshToken', RefreshToken);
  };

  public logout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionToken');

    this.removeToken();

    this._router.navigate(['/login']);
  };

  public isAuthenticated = (): boolean => {
    const token = this.getToken();
    if (!token) return false;

    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  isUserAdmin(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }
    try {
      const decoded: any = jwtDecode(token);
      const normalizedEmail = decoded?.username?.toLowerCase().trim();
      return normalizedEmail?.endsWith('@rozie.ai') ?? false;
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  public getUserEmail = (): string | null => localStorage.getItem('userEmail');

  public getIdToken = (): string | null => localStorage.getItem('idToken');

  public getRefreshToken = (): string | null =>
    localStorage.getItem('refreshToken');

  public checkSession = async (): Promise<void> => {
    try {
      await getCurrentUser();
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('No valid session');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      await this.logout();
      throw error;
    }
  };

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

  getUserRole(): UserRole {
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
      } else if (groups.some((group) => group.includes('EVENT_ORGANIZER'))) {
        return UserRole.EVENTORGANIZER;
      } else {
        return UserRole.EDITOR;
      }
    } catch (error) {
      console.error('Error decoding access token:', error);
      // TODO: @later this can be handled better with a non logged in state
      return UserRole.EDITOR;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this._tokenKey);
  }

  // TODO: remove as it's not used
  setToken(token: string): void {
    localStorage.setItem(this._tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this._tokenKey);
  }

  isTokenExpired(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return true;
    }

    try {
      const decodedToken: any = jwtDecode(accessToken);
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = Date.now();
      return currentTime >= expirationTime;
    } catch (error) {
      return true;
    }
  }

  private startTokenCheck(): void {
    interval(this._tokenCheckIntervalMs)
      .pipe(
        filter(
          () =>
            !this._route.snapshot.children?.[0]?.routeConfig?.path.includes(
              'otp'
            )
        ),
        takeUntilDestroyed(this._destroyRef),
        tap(() => this.runTokenCheck())
      )
      .subscribe();
  }

  private runTokenCheck(): void {
    if (this.isTokenExpired()) {
      this.logout();
    }
  }
}

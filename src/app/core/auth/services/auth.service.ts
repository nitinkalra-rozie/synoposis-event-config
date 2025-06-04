import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Amplify } from 'aws-amplify';
import {
  AuthTokens,
  fetchAuthSession,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { from, interval, Observable, of, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

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
  private readonly _tokenCheckIntervalMs = 60000;
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _isLoggingOut = signal<boolean>(false);

  logout(): Observable<void> {
    if (this._isLoggingOut()) {
      return of(void 0);
    }

    this._isLoggingOut.set(true);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');

    return from(signOut({ global: true })).pipe(
      tap(() => {
        this._router.navigate(['/login'], { replaceUrl: true });
      }),
      map(() => void 0),
      catchError((error) => {
        console.warn('Logout error (continuing with navigation):', error);
        this._router.navigate(['/login'], { replaceUrl: true });
        return of(void 0);
      }),
      tap(() => {
        this._isLoggingOut.set(false);
      })
    );
  }

  isUserAdmin(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const accessToken = session.tokens?.accessToken?.toString();

        if (!accessToken) {
          return false;
        }

        const decoded: any = jwtDecode(accessToken);
        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        const isAdmin = normalizedEmail?.endsWith('@rozie.ai') ?? false;

        return isAdmin;
      })
    );
  }

  getAccessToken(): Observable<string | null> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const accessToken = session.tokens?.accessToken?.toString() || null;
        return accessToken;
      })
    );
  }

  getIdToken(): Observable<string | null> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const idToken = session.tokens?.idToken?.toString() || null;
        return idToken;
      })
    );
  }

  getUserEmail(): Observable<string | null> {
    return from(getCurrentUser()).pipe(
      map((user) => {
        const email = user.signInDetails?.loginId || user.username;
        return email;
      })
    );
  }

  checkSession$(): Observable<boolean> {
    return from(getCurrentUser()).pipe(
      switchMap((user) =>
        from(fetchAuthSession()).pipe(
          map((session) => {
            if (!session.tokens) {
              throw new Error('No valid session tokens');
            }

            this.logAllTokens(session.tokens);
            return true;
          })
        )
      ),
      catchError((error) =>
        this.logout().pipe(switchMap(() => throwError(() => error)))
      )
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(null);
        }

        const decodedToken: any = jwtDecode(accessToken);
        const userGroups = decodedToken['cognito:groups'] || [];
        return of(userGroups);
      })
    );
  }

  getUserRole$(): Observable<UserRole> {
    return this.getAccessToken().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(UserRole.EDITOR);
        }

        const decodedToken: any = jwtDecode(accessToken);
        const email = decodedToken.email || decodedToken.username;

        if (email && email.endsWith('@rozie.ai')) {
          return of(UserRole.SUPERADMIN);
        }

        return this.getUserGroups$().pipe(
          map((groups) => {
            let role = UserRole.EDITOR;

            if (groups?.some((group) => group.includes('SUPER_ADMIN'))) {
              role = UserRole.SUPERADMIN;
            } else if (groups?.some((group) => group.includes('ADMIN'))) {
              role = UserRole.ADMIN;
            } else if (
              groups?.some((group) => group.includes('EVENT_ORGANIZER'))
            ) {
              role = UserRole.EVENTORGANIZER;
            }

            return role;
          })
        );
      })
    );
  }

  isTokenExpired$(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const accessToken = session.tokens?.accessToken;

        if (!accessToken) {
          return true;
        }

        const decodedToken: any = jwtDecode(accessToken.toString());
        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();
        const isExpired = currentTime >= expirationTime;

        return isExpired;
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const isAuthenticated = !!session.tokens?.accessToken;

        if (isAuthenticated) {
          this.logAllTokens(session.tokens);
        }

        return isAuthenticated;
      }),
      catchError((error) => {
        console.error('Error checking authentication status:', error);
        return of(false);
      })
    );
  }

  private logAllTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      const accessTokenStr = tokens.accessToken.toString();
      try {
        const decoded = jwtDecode(accessTokenStr);
      } catch (error) {
        console.error('Token decode failed', error);
      }
    }

    if (tokens.idToken) {
      const idTokenStr = tokens.idToken.toString();
      try {
        const decoded = jwtDecode(idTokenStr);
      } catch (error) {
        console.error('Token decode failed', error);
      }
    }
  }

  private startTokenCheck(): void {
    interval(this._tokenCheckIntervalMs)
      .pipe(
        filter(() => !this._isLoggingOut()),
        filter(
          () =>
            !this._route.snapshot.children?.[0]?.routeConfig?.path?.includes(
              'otp'
            )
        ),
        takeUntilDestroyed(this._destroyRef),
        switchMap(() => this.runTokenCheck$())
      )
      .subscribe();
  }

  private runTokenCheck$(): Observable<void> {
    if (this._isLoggingOut()) {
      return of(void 0);
    }

    return from(fetchAuthSession()).pipe(
      switchMap((session) => {
        if (!session.tokens?.accessToken) {
          return this.logout();
        } else {
          return of(void 0);
        }
      }),
      catchError((error) => this.logout())
    );
  }
}

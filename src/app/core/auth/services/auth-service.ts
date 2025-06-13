import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Amplify } from 'aws-amplify';
import {
  AuthTokens,
  fetchAuthSession,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { from, Observable, of, Subject, timer } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  share,
  switchMap,
  tap,
} from 'rxjs/operators';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {
    Amplify.configure(amplifyConfig);
  }

  public readonly _tokenRefreshSubject = new Subject<boolean>();
  public readonly tokenRefreshed$ = this._tokenRefreshSubject
    .asObservable()
    .pipe(share());

  private readonly _router: Router = inject(Router);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);

  private readonly _isRefreshing = signal<boolean>(false);
  private readonly _isLoggingOut = signal<boolean>(false);

  logout$(): Observable<void> {
    if (this._isLoggingOut()) {
      return of(void 0);
    }
    this._isLoggingOut.set(true);

    return from(signOut({ global: true })).pipe(
      tap(() => {
        this._router.navigate(['/login'], { replaceUrl: true });
      }),
      map(() => void 0),
      finalize(() => {
        this._isLoggingOut.set(false);
      }),
      catchError(() => {
        this._router.navigate(['/login'], { replaceUrl: true });
        return of(void 0);
      })
    );
  }

  isUserAdmin$(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const accessToken = session.tokens?.accessToken?.toString();
        if (!accessToken) {
          return false;
        }
        const decoded: JwtPayload = jwtDecode(accessToken);
        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        const isSuperAdmin =
          normalizedEmail?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ?? false;
        return isSuperAdmin;
      })
    );
  }

  getAccessToken$(): Observable<string | null> {
    return from(fetchAuthSession()).pipe(
      map((session) => session.tokens?.accessToken?.toString() || null)
    );
  }

  getIdToken$(): Observable<string | null> {
    return from(fetchAuthSession()).pipe(
      map((session) => session.tokens?.idToken?.toString() || null)
    );
  }

  getUserEmail$(): Observable<string | null> {
    return from(getCurrentUser()).pipe(
      map((user) => user.signInDetails?.loginId || user.username)
    );
  }

  checkSession$(): Observable<boolean> {
    return from(getCurrentUser()).pipe(
      switchMap((user) =>
        from(fetchAuthSession()).pipe(
          tap((session) => {
            if (!session.tokens) {
              throw new Error('No valid session tokens');
            }
            this.logAllTokens(session.tokens);
          }),
          map(() => true)
        )
      )
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(null);
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken);
        const userGroups = decodedToken['cognito:groups'] || [];
        return of(userGroups);
      })
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(null);
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken);
        const email = decodedToken.email || decodedToken.username;
        if (email && email.endsWith(SUPER_ADMIN_EMAIL_DOMAIN)) {
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
        const decodedToken: JwtPayload = jwtDecode(accessToken.toString());
        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();
        return currentTime >= expirationTime;
      })
    );
  }

  refreshTokens$(): Observable<boolean> {
    if (this._isRefreshing() || this._isLoggingOut()) {
      return of(false);
    }

    this._isRefreshing.set(true);

    return from(fetchAuthSession({ forceRefresh: true })).pipe(
      map((session) => {
        const hasValidTokens = !!(
          session.tokens?.accessToken && session.tokens?.idToken
        );
        if (hasValidTokens) {
          this.logAllTokens(session.tokens!);
          this._tokenRefreshSubject.next(true);
          this.scheduleNextRefresh();
        }
        return hasValidTokens;
      }),
      finalize(() => {
        this._isRefreshing.set(false);
      }),
      catchError((error) => {
        if (this.isRefreshTokenExpired(error)) {
          this.forceLogoutDueToExpiredRefreshToken();
          return of(false);
        }

        this._tokenRefreshSubject.next(false);
        return of(false);
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
      })
    );
  }

  initializeTokenRefreshScheduling(): void {
    this.scheduleNextRefresh();
  }

  handleAuthError$(): Observable<boolean> {
    return this.refreshTokens$().pipe(
      switchMap((success) => {
        if (!success) {
          if (this._isLoggingOut()) {
            return of(false);
          }
          return this.logout$().pipe(map(() => false));
        }
        return of(true);
      })
    );
  }

  private logAllTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      const decodedAccess = jwtDecode(tokens.accessToken.toString());
    }
    if (tokens.idToken) {
      const decodedId = jwtDecode(tokens.idToken.toString());
    }
  }

  private scheduleNextRefresh(): void {
    from(fetchAuthSession())
      .pipe(
        map((session) => {
          const accessToken = session.tokens?.accessToken;
          if (!accessToken) {
            return 0;
          }

          const decodedToken: JwtPayload = jwtDecode(accessToken.toString());
          const expirationTime = decodedToken.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;

          const refreshIn = Math.max(
            30000,
            timeUntilExpiry - REFRESH_THRESHOLD_MS
          );

          return refreshIn;
        }),
        switchMap((refreshIn) => {
          if (refreshIn <= 0) {
            return of(void 0);
          }

          return timer(refreshIn).pipe(
            switchMap(() => this.refreshTokens$()),
            takeUntilDestroyed(this._destroyRef)
          );
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        error: (error) => {
          console.error('Token refresh scheduling error:', error);
        },
      });
  }

  private isRefreshTokenExpired(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || error?.name || '';

    const expiredRefreshTokenPatterns = [
      'refresh token has expired',
      'refresh token is expired',
      'invalid refresh token',
      'notauthorizedexception',
      'refresh_token_expired',
      'token_expired',
    ];

    return (
      expiredRefreshTokenPatterns.some(
        (pattern) =>
          errorMessage.includes(pattern) ||
          errorCode.toLowerCase().includes(pattern)
      ) || error?.status === 401
    );
  }

  private forceLogoutDueToExpiredRefreshToken(): void {
    this._isLoggingOut.set(true);

    this._router.navigate(['/login'], {
      replaceUrl: true,
      queryParams: { reason: 'session_expired' },
    });

    from(signOut({ global: true }))
      .pipe(
        finalize(() => {
          this._isLoggingOut.set(false);
        }),
        catchError(() => of(void 0))
      )
      .subscribe();
  }
}

import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthTokens, getCurrentUser, signOut } from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import {
  defer,
  EMPTY,
  from,
  interval,
  Observable,
  of,
  Subject,
  throwError,
  timer,
} from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  map,
  mapTo,
  retry,
  share,
  switchMap,
  tap,
  timeout,
} from 'rxjs/operators';
import {
  AuthSession,
  TokenRefreshError,
} from 'src/app/core/auth/data-service/auth.data-model';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';
import { AuthStore } from './auth-store';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
const TOKEN_CHECK_INTERVAL_MS = 60000;
const REFRESH_TIMEOUT_MS = 5000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {
    this._startTokenCheck();
  }
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authStore = inject(AuthStore);

  private readonly _isLoggingOut = signal<boolean>(false);
  private readonly _isRefreshing = signal<boolean>(false);

  private readonly _refreshInProgress$ = new Subject<boolean>();

  initializeAuth$(): Observable<boolean> {
    return this._authStore.getSession$().pipe(
      map((session) => {
        const isAuthenticated =
          session.isAuthenticated && !!session.tokens?.accessToken;
        return isAuthenticated;
      }),
      catchError((error) => throwError(() => error))
    );
  }

  logout$(): Observable<void> {
    if (this._isLoggingOut()) {
      return EMPTY;
    }

    this._isLoggingOut.set(true);

    return from(signOut({ global: true })).pipe(
      tap(() => {
        this._authStore.invalidateCache();
        this._router.navigate(['/login']);
      }),
      finalize(() => {
        this._isLoggingOut.set(false);
      }),
      catchError((error) => {
        this._router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  isUserAdmin$(): Observable<boolean> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) {
          return false;
        }
        const decoded: JwtPayload = jwtDecode(accessToken);
        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        return normalizedEmail?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ?? false;
      })
    );
  }

  getAccessToken$(): Observable<string | null> {
    return this._authStore
      .getSession$()
      .pipe(map((session) => session.tokens?.accessToken?.toString() || null));
  }

  getIdToken$(): Observable<string | null> {
    return this._authStore
      .getSession$()
      .pipe(map((session) => session.tokens?.idToken?.toString() || null));
  }

  getUserEmail$(): Observable<string | null> {
    return this._authStore.getSession$().pipe(
      switchMap((session) => {
        if (!session.isAuthenticated || !session.tokens?.accessToken) {
          return EMPTY;
        }
        return from(getCurrentUser()).pipe(
          map((user) => user.signInDetails?.loginId || user.username),
          catchError((error) => throwError(() => error))
        );
      })
    );
  }

  checkSession$(): Observable<boolean> {
    return this._authStore.getSession$().pipe(
      switchMap((session) => {
        if (!session.isAuthenticated || !session.tokens?.accessToken) {
          return of(false);
        }

        return from(getCurrentUser()).pipe(
          map(() => {
            this._logAllTokens(session.tokens!);
            return true;
          }),
          catchError((error) => {
            console.error('[AuthService] getCurrentUser failed:', error);
            return of(false);
          })
        );
      }),
      catchError((error) => {
        console.error('[AuthService] Session check failed:', error);
        return of(false);
      })
    );
  }

  getSessionDetails$(): Observable<AuthSession | null> {
    return this._authStore.getSession$().pipe(
      map((session) => {
        if (!session.isAuthenticated || !session.tokens?.accessToken) {
          return null;
        }
        return session;
      }),
      catchError((error) => throwError(() => error))
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) {
          return null;
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken);
        return decodedToken['cognito:groups'] || [];
      })
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return EMPTY;
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

  isAuthenticated(): Observable<boolean> {
    return this._authStore.getSession$().pipe(
      map((session) => {
        const isAuth = session.isAuthenticated && !!session.tokens?.accessToken;
        return isAuth;
      }),
      catchError((error) => throwError(() => error))
    );
  }

  private _refreshTokens$(): Observable<AuthSession> {
    if (this._isLoggingOut()) {
      return EMPTY;
    }

    this._refreshInProgress$.next(true);
    this._isRefreshing.set(true);

    return this._authStore.forceRefreshSession$().pipe(
      timeout(REFRESH_TIMEOUT_MS),
      retry({
        count: MAX_RETRY_ATTEMPTS,
        delay: (retryIndex) => timer(RETRY_DELAY_MS * Math.pow(2, retryIndex)),
        resetOnSuccess: true,
      }),
      catchError((error) => this._handleTokenRefreshError(error)),
      finalize(() => {
        this._isRefreshing.set(false);
        this._refreshInProgress$.next(false);
      }),
      share()
    );
  }

  private _handleTokenRefreshError(error: any): Observable<never> {
    const tokenRefreshError = this._categorizeRefreshError(error);

    if (this._shouldLogoutOnRefreshError(tokenRefreshError)) {
      return this.logout$().pipe(
        switchMap(() => throwError(() => tokenRefreshError))
      );
    }

    return throwError(() => tokenRefreshError);
  }

  private _categorizeRefreshError(error: any): TokenRefreshError {
    if (
      error.name === 'TimeoutError' ||
      error.message?.includes('timeout') ||
      error.message?.includes('network') ||
      error.status === 0
    ) {
      return {
        type: 'NETWORK_ERROR',
        originalError: error,
        message: 'Network error during token refresh',
      };
    }

    if (
      error.message?.toLowerCase().includes('refresh token') ||
      error.message?.includes('invalid_grant') ||
      error.message?.includes('token_expired') ||
      error.status === 401
    ) {
      return {
        type: 'REFRESH_TOKEN_EXPIRED',
        originalError: error,
        message: 'Refresh token expired or invalid',
      };
    }

    return {
      type: 'UNKNOWN_ERROR',
      originalError: error,
      message: error.message || 'Unknown token refresh error',
    };
  }

  private _shouldLogoutOnRefreshError(error: TokenRefreshError): boolean {
    if (error.type === 'REFRESH_TOKEN_EXPIRED') {
      return true;
    }

    if (error.type === 'NETWORK_ERROR') {
      return false;
    }

    return true;
  }

  private _logAllTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      jwtDecode(tokens.accessToken.toString());
    }
    if (tokens.idToken) {
      jwtDecode(tokens.idToken.toString());
    }
  }

  private _startTokenCheck(): void {
    interval(TOKEN_CHECK_INTERVAL_MS)
      .pipe(
        filter(() => !this._isLoggingOut() && !this._isRefreshing()),
        filter(
          () =>
            !this._route.snapshot.children?.[0]?.routeConfig?.path?.includes(
              'otp'
            )
        ),
        takeUntilDestroyed(this._destroyRef),
        switchMap(() => this._runTokenCheck$())
      )
      .subscribe();
  }

  private _runTokenCheck$(): Observable<void> {
    if (this._isLoggingOut() || this._isRefreshing()) {
      return EMPTY;
    }

    return this._authStore.getSession$().pipe(
      switchMap((session) => this._processSessionForTokenCheck$(session)),
      catchError(() => this.logout$())
    );
  }

  private _processSessionForTokenCheck$(
    session: AuthSession
  ): Observable<void> {
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      return this.logout$();
    }

    return this._decodeAccessToken$(accessToken).pipe(
      switchMap((decoded) => this._handleTokenExpiry$(decoded)),
      catchError(() => this.logout$())
    );
  }

  private _decodeAccessToken$(accessToken: string): Observable<JwtPayload> {
    return defer(() => {
      try {
        const decoded = jwtDecode<JwtPayload>(accessToken);
        return of(decoded);
      } catch (error) {
        return throwError(() => error);
      }
    });
  }

  private _handleTokenExpiry$(decoded: JwtPayload): Observable<void> {
    const timeUntilExpiry = this._calculateTimeUntilExpiry(decoded);
    const REFRESH_THRESHOLD_SECONDS = 300;

    if (this._shouldRefreshToken(timeUntilExpiry, REFRESH_THRESHOLD_SECONDS)) {
      return this._refreshTokens$().pipe(
        mapTo(undefined),
        catchError(() => this.logout$())
      );
    }

    return EMPTY;
  }

  private _calculateTimeUntilExpiry(decoded: JwtPayload): number {
    const currentTime = Math.floor(Date.now() / 1000);
    return (decoded.exp || 0) - currentTime;
  }

  private _shouldRefreshToken(
    timeUntilExpiry: number,
    threshold: number
  ): boolean {
    return timeUntilExpiry <= threshold;
  }
}

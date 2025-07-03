import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  finalize,
  from,
  interval,
  map,
  Observable,
  of,
  retryWhen,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { TOKEN_REFRESH_CONFIG } from 'src/app/core/auth/constants/auth-constants';
import { classifyTokenRefreshError } from 'src/app/core/auth/error-handling/auth-error-handler-fn';
import { AuthSessionService } from 'src/app/core/auth/services/auth-session';
import { AuthStore } from 'src/app/core/auth/stores/auth-store';

const TOKEN_CHECK_INTERVAL_MS = 3000;

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService {
  constructor() {
    this._startTokenCheck();
  }

  private readonly _sessionService = inject(AuthSessionService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authStore = inject(AuthStore);

  getAccessToken(): string | null {
    return this._authStore.getSession().tokens?.accessToken?.toString() || null;
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

  isAuthenticated$(): Observable<boolean> {
    return this._authStore.getSession$().pipe(
      map((session) => {
        if (!session) {
          return false;
        }
        return session.isAuthenticated && !!session.tokens?.accessToken;
      })
    );
  }

  getValidToken$(): Observable<string> {
    return toObservable(this._authStore.$isTokenValid).pipe(
      switchMap((isValid) => {
        if (isValid && !this._authStore.$isTokenNearExpiry()) {
          const token = this._authStore
            .getSession()
            .tokens?.accessToken?.toString();
          return of(token || '');
        } else {
          return this._refreshToken$();
        }
      })
    );
  }

  private _startTokenCheck(): void {
    interval(TOKEN_CHECK_INTERVAL_MS)
      .pipe(
        filter(() => !this._authStore.$isLoggingOut()),
        filter(() => !this._authStore.$refreshInProgress()),
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

  private _runTokenCheck$(): Observable<string> {
    if (
      this._authStore.$isLoggingOut() ||
      this._authStore.$refreshInProgress()
    ) {
      return EMPTY;
    }

    return this._authStore.getSession$().pipe(
      switchMap((session) => {
        if (!session.tokens?.accessToken && !session.isAuthenticated) {
          if (!this._authStore.$isLoggingOut()) {
            return this._sessionService.logout$().pipe(switchMap(() => EMPTY));
          }
          return EMPTY;
        }

        if (this._isTokenExpired()) {
          this._authStore.setTokenStatus('expired');
          return this._refreshToken$();
        }

        if (this._authStore.$isTokenNearExpiry()) {
          this._authStore.setTokenStatus('near-expiry');
          return this._refreshToken$();
        }

        const currentToken = session.tokens?.accessToken?.toString();
        return currentToken ? of(currentToken) : EMPTY;
      }),
      catchError(() => EMPTY)
    );
  }

  private _refreshToken$(): Observable<string> {
    if (this._authStore.$refreshInProgress()) {
      const currentToken = this._authStore
        .getSession()
        .tokens?.accessToken?.toString();
      return currentToken ? of(currentToken) : EMPTY;
    }

    this._authStore.setRefreshInProgress(true);
    this._authStore.setTokenStatus('refreshing');

    return this._performTokenRefresh$().pipe(
      finalize(() => {
        this._authStore.setRefreshInProgress(false);
      })
    );
  }

  private _performTokenRefresh$(): Observable<string> {
    return from(fetchAuthSession({ forceRefresh: true })).pipe(
      tap((session) => {
        this._authStore.updateSession({
          tokens: session.tokens ?? null,
          isAuthenticated: !!session.tokens?.accessToken,
          lastFetched: Date.now(),
        });
        this._authStore.setTokenStatus(
          !!session.tokens?.accessToken ? 'valid' : 'invalid'
        );
      }),
      map((session) => session.tokens?.accessToken?.toString() || ''),
      retryWhen((errors) =>
        errors.pipe(
          concatMap((error, index) => {
            const authError = classifyTokenRefreshError(error);
            const retryCount = index + 1;

            if (retryCount > TOKEN_REFRESH_CONFIG.MAX_RETRY_ATTEMPTS) {
              return throwError(() => authError);
            }

            if (!authError.isRetryable) {
              return throwError(() => authError);
            }

            const delayMs = Math.min(
              TOKEN_REFRESH_CONFIG.RETRY_DELAY_MS *
                Math.pow(
                  TOKEN_REFRESH_CONFIG.EXPONENTIAL_BACKOFF_MULTIPLIER,
                  retryCount - 1
                ),
              TOKEN_REFRESH_CONFIG.MAX_RETRY_DELAY_MS
            );
            return timer(delayMs);
          })
        )
      ),
      catchError((error) => {
        const authError = classifyTokenRefreshError(error);
        this._authStore.updateSession({
          tokens: null,
          isAuthenticated: false,
          lastFetched: Date.now(),
        });
        this._authStore.setTokenStatus('invalid');
        return this._handleTokenRefreshError$(authError);
      })
    );
  }

  private _handleTokenRefreshError$(authError: any): Observable<string> {
    this._authStore.setLastRefreshError(authError);

    switch (authError.type) {
      case 'REFRESH_TOKEN_EXPIRED':
      case 'UNAUTHENTICATED':
      case 'UNAUTHORIZED':
        return this._sessionService
          .logout$()
          .pipe(switchMap(() => throwError(() => authError)));

      case 'NETWORK_ERROR':
        return throwError(() => authError);

      default:
        return throwError(() => authError);
    }
  }

  private _isTokenExpired(): boolean {
    const sessionExpiry = this._authStore.$sessionExpiry();
    if (!sessionExpiry) {
      return false;
    }
    return Date.now() >= sessionExpiry;
  }
}

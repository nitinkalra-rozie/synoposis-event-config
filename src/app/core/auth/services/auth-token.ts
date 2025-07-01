import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  catchError,
  EMPTY,
  filter,
  finalize,
  from,
  interval,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
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

  private readonly _isLoggingOut = signal<boolean>(false);

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

  isAuthenticated(): Observable<boolean> {
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
    return this._authStore.getSession$().pipe(
      switchMap((session) => {
        const token = session.tokens?.accessToken?.toString();
        if (token) {
          return of(token);
        }
        return this._refreshToken$();
      })
    );
  }

  forceRefreshToken$(): Observable<string> {
    return this._refreshToken$();
  }

  getTokenForRequest$(): Observable<string> {
    return this._authStore.getSession$().pipe(
      switchMap((session) => {
        const tokenStatus = this._authStore.tokenStatus$();
        if (tokenStatus === 'valid' && session.tokens?.accessToken) {
          return of(session.tokens.accessToken.toString());
        }
        if (tokenStatus === 'refreshing') {
          return this._waitForRefreshCompletion$();
        }
        return this._refreshToken$();
      })
    );
  }

  private _startTokenCheck(): void {
    interval(TOKEN_CHECK_INTERVAL_MS)
      .pipe(
        filter(() => !this._isLoggingOut()),
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
    if (this._isLoggingOut()) {
      return EMPTY;
    }

    return this._authStore.getSession$().pipe(
      switchMap((session) => {
        if (!session.tokens?.accessToken && session.isAuthenticated === false) {
          if (!this._isLoggingOut()) {
            this._isLoggingOut.set(true);
            return this._sessionService
              .logout$()
              .pipe(finalize(() => this._isLoggingOut.set(false)));
          }
        }

        const tokenStatus = this._authStore.tokenStatus$();
        if (tokenStatus === 'expired' && session.isAuthenticated) {
          return this._refreshToken$().pipe(
            map(() => void 0),
            catchError(() => {
              if (!this._isLoggingOut()) {
                this._isLoggingOut.set(true);
                return this._sessionService
                  .logout$()
                  .pipe(finalize(() => this._isLoggingOut.set(false)));
              }
              return EMPTY;
            })
          );
        }

        return EMPTY;
      })
    );
  }

  private _waitForRefreshCompletion$(): Observable<string> {
    return interval(100).pipe(
      switchMap(() => this._authStore.getSession$()),
      filter((session) => this._authStore.tokenStatus$() !== 'refreshing'),
      map((session) => session.tokens?.accessToken?.toString() || ''),
      take(1)
    );
  }

  private _refreshToken$(): Observable<string> {
    return from(fetchAuthSession({ forceRefresh: true })).pipe(
      tap((session) => {
        this._authStore.updateSession({
          tokens: session.tokens ?? null,
          isAuthenticated: !!session.tokens?.accessToken,
          lastFetched: Date.now(),
        });
      }),
      map((session) => session.tokens?.accessToken?.toString() || ''),
      catchError(() => {
        this._authStore.updateSession({
          tokens: null,
          isAuthenticated: false,
          lastFetched: Date.now(),
        });
        return of('');
      })
    );
  }
}

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
  take,
  tap,
  throwError,
  timer,
} from 'rxjs';
import {
  SESSION_NOTIFICATION_MESSAGE,
  TOKEN_REFRESH_CONFIG,
} from 'src/app/core/auth/constants/auth-constants';
import {
  AuthError,
  authErrorHandlerFn,
  classifyError,
} from 'src/app/core/auth/error-handling/auth-error-handler-fn';
import { AuthSessionService } from 'src/app/core/auth/services/auth-session';
import { AuthStore } from 'src/app/core/auth/stores/auth-store';
import { SynToastFacade } from 'src/app/shared/components/syn-toast/syn-toast-facade';
import { ToastRef } from 'src/app/shared/components/syn-toast/syn-toast.model';

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
  private readonly _toastFacade = inject(SynToastFacade);

  private _warningShown = false;

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
        tap(() => this._runTokenCheck())
      )
      .subscribe();
  }

  private _runTokenCheck(): void {
    if (
      this._authStore.$isLoggingOut() ||
      this._authStore.$refreshInProgress()
    ) {
      return;
    }
    this._authStore
      .getSession$()
      .pipe(
        take(1),
        switchMap((session) => {
          if (!session?.tokens?.accessToken || !session.isAuthenticated) {
            if (!this._authStore.$isLoggingOut()) {
              return this._sessionService.logout$();
            }
            return EMPTY;
          }
          const isExpired = this._isTokenExpired();
          const isNearExpiry = this._authStore.$isTokenNearExpiry();

          if (isExpired) {
            this._authStore.setTokenStatus('expired');
            return this._refreshToken$();
          }

          if (isNearExpiry) {
            this._authStore.setTokenStatus('near-expiry');
            if (!this._warningShown) {
              this._warningShown = true;

              this._toastFacade.showWarning(
                SESSION_NOTIFICATION_MESSAGE.SESSION_EXPIRY_WARNING,
                6000
              );
            }
            return this._refreshToken$();
          }
          return EMPTY;
        }),

        catchError(() => EMPTY)
      )
      .subscribe();
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
        this._warningShown = false;
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
            const authError = classifyError(error);
            const retryCount = index + 1;

            const retryTypes: AuthError['type'][] = ['NETWORK_ERROR'];

            if (retryCount > TOKEN_REFRESH_CONFIG.MAX_RETRY_ATTEMPTS) {
              return throwError(() => authError);
            }

            if (!retryTypes.includes(authError.type)) {
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
        const authError = classifyError(error);
        const handleError = authErrorHandlerFn();

        this._authStore.updateSession({
          tokens: null,
          isAuthenticated: false,
          lastFetched: Date.now(),
        });
        this._authStore.setTokenStatus('invalid');
        this._authStore.setLastRefreshError(authError);

        const toastRef: ToastRef = this._toastFacade.show({
          type: 'error',
          message: SESSION_NOTIFICATION_MESSAGE.SESSION_EXPIRED,
          action: {
            label: 'Ok',
            handler: () => {
              this._toastFacade.dismiss(toastRef.id);
            },
          },
        });

        return handleError<string>(authError.originalError || authError, false);
      })
    );
  }

  private _isTokenExpired(): boolean {
    const sessionExpiry = this._authStore.$sessionExpiry();
    if (!sessionExpiry) {
      return false;
    }
    return Date.now() >= sessionExpiry;
  }
}

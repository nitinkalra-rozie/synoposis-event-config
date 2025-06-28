import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { EMPTY, from, interval, Observable, of, throwError, timer } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AuthSession } from 'src/app/core/auth/data-service/auth.data-model';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';
import { AuthStore } from './auth-store';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
const TOKEN_CHECK_INTERVAL_MS = 60000;
const REFRESH_BUFFER_TIME_MS = 60 * 1000;

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

  getUserEmail$(): Observable<string | null> {
    return from(getCurrentUser()).pipe(
      map((user) => user.signInDetails?.loginId || user.username)
    );
  }

  checkSession$(): Observable<AuthSession> {
    return from(getCurrentUser()).pipe(
      switchMap(() => this._authStore.getSession$())
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
    return this._authStore
      .getSession$()
      .pipe(map((session) => session.isAuthenticated));
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
        if (!session.tokens?.accessToken) {
          return this.logout$();
        } else {
          return EMPTY;
        }
      })
    );
  }

  private scheduleTokenRefresh(): void {
    this._authStore
      .getSession$()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        switchMap((session) => {
          const accessToken = session.tokens?.accessToken;

          if (!accessToken) {
            return EMPTY;
          }

          const decodedToken: JwtPayload = jwtDecode(accessToken.toString());
          const tokenExpiryTime = decodedToken.exp * 1000;
          const timeUntilExpiry = tokenExpiryTime - Date.now();

          const refreshIn = Math.max(
            0,
            timeUntilExpiry - REFRESH_BUFFER_TIME_MS
          );

          if (refreshIn <= 0) {
            return this._refreshTokenFlow$();
          }

          return timer(refreshIn).pipe(
            switchMap(() => this._refreshTokenFlow$())
          );
        }),
        catchError((error) => throwError(() => error))
      )
      .subscribe();
  }

  private _refreshTokenFlow$(): Observable<void> {
    if (this._isLoggingOut()) {
      return EMPTY;
    }

    return this._authStore.updateSessionWithLatestTokens$().pipe(
      tap(() => {
        this.scheduleTokenRefresh();
      }),
      catchError(() => this.logout$())
    );
  }
}

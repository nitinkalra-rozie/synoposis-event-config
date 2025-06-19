import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { signOut } from 'aws-amplify/auth';
import { from, interval, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { AuthStore } from 'src/app/core/auth/services/auth-store';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

const TOKEN_CHECK_INTERVAL_MS = 60000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {
    this.startTokenCheck$();
  }

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authStore = inject(AuthStore);

  private readonly _isLoggingOut = signal<boolean>(false);

  logout$(): Observable<void> {
    return from(signOut());
  }

  isUserAdmin$(): Observable<boolean> {
    return this._authStore.isUserAdmin$();
  }

  getAccessToken$(): Observable<string | null> {
    return this._authStore.getAccessToken$();
  }

  getIdToken$(): Observable<string | null> {
    return this._authStore.getIdToken$();
  }

  getUserEmail$(): Observable<string | null> {
    return this._authStore.getUserEmail$();
  }

  checkSession$(): Observable<boolean> {
    return this._authStore.getSession$().pipe(
      map((session) => {
        if (!session.tokens) {
          throw new Error('No valid session tokens');
        }
        return true;
      })
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this._authStore.getUserGroups$();
  }

  getUserRole$(): Observable<UserRole | null> {
    return this._authStore.getUserRole$();
  }

  isTokenExpired$(): Observable<boolean> {
    return this._authStore.isTokenExpired$();
  }

  isAuthenticated(): Observable<boolean> {
    return this._authStore.isAuthenticated$();
  }

  private startTokenCheck$(): void {
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
        switchMap(() => this.runTokenCheck$())
      )
      .subscribe();
  }

  private runTokenCheck$(): Observable<void> {
    if (this._isLoggingOut()) {
      return of(void 0);
    }

    const cachedSession = this._authStore.getCachedSession();

    if (!cachedSession?.tokens?.accessToken) {
      return this._authStore.refreshSession$().pipe(
        switchMap((session) => {
          if (!session.tokens?.accessToken) {
            return this.logout$();
          }
          return of(void 0);
        }),
        catchError(() => this.logout$())
      );
    }

    return of(void 0);
  }
}

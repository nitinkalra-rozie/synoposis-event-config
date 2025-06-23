import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { EMPTY, from, interval, Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { JwtPayload, UserRole } from '../../enum/auth-roles.enum';
import { AuthSession } from '../data-service/auth.data-model';
import { AuthStore } from './auth-store';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
const TOKEN_CHECK_INTERVAL_MS = 60000;
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

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
    this._isLoggingOut.set(true);
    this._authStore.clearSession();
    return from(signOut()).pipe(
      tap(() => this._isLoggingOut.set(false)),
      catchError(() => {
        this._isLoggingOut.set(false);
        return EMPTY;
      })
    );
  }

  getSession$(): Observable<AuthSession> {
    return of(this._authStore.getSession()).pipe(
      switchMap((cached) => {
        if (cached && !this.isTokenExpiredSync(cached)) {
          return of(cached);
        }
        return this.refreshSession$();
      }),
      filter((session): session is AuthSession => !!session)
    );
  }

  getAccessToken$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => session.tokens?.accessToken?.toString() ?? null)
    );
  }

  getIdToken$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => session.tokens?.idToken?.toString() ?? null)
    );
  }

  getUserEmail$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => {
        const user = session.user;
        return user?.signInDetails?.loginId || user?.username || null;
      }),
      distinctUntilChanged()
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken$().pipe(
      map((token) => {
        const decoded = this.decodeToken(token);
        return decoded?.['cognito:groups'] || null;
      })
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this.getAccessToken$().pipe(
      map((token) => {
        const decoded = this.decodeToken(token);
        if (!decoded) {
          return UserRole.UNAUTHENTICATED;
        }

        const email = decoded.email || decoded.username;

        if (email?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN)) {
          return UserRole.SUPERADMIN;
        }

        const groups = decoded['cognito:groups'] || [];

        if (groups.some((g) => g.includes('SUPER_ADMIN')))
          return UserRole.SUPERADMIN;
        if (groups.some((g) => g.includes('ADMIN'))) return UserRole.ADMIN;
        if (groups.some((g) => g.includes('EVENT_ORGANIZER')))
          return UserRole.EVENTORGANIZER;

        if (groups.some((g) => g.includes('EDITOR'))) return UserRole.EDITOR;

        return UserRole.SUPERADMIN;
      }),
      distinctUntilChanged()
    );
  }

  isUserAdmin$(): Observable<boolean> {
    return this.getUserEmail$().pipe(
      map(
        (email) =>
          email?.toLowerCase().trim().endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ??
          false
      )
    );
  }

  isTokenExpired$(): Observable<boolean> {
    return this.getAccessToken$().pipe(
      map((token) => {
        const decoded = this.decodeToken(token);
        return !decoded || decoded.exp * 1000 <= Date.now();
      })
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this.getAccessToken$().pipe(map((token) => !!token));
  }

  refreshSession$(): Observable<AuthSession> {
    if (this._authStore.isLoading()) {
      const existing = this._authStore.getSession();
      return of(existing).pipe(
        filter((session): session is AuthSession => !!session)
      );
    }

    this._authStore.setLoading(true);

    return from(fetchAuthSession()).pipe(
      switchMap((session) =>
        from(getCurrentUser()).pipe(
          map((user) => this.createSession(session.tokens, user))
        )
      ),
      catchError(() =>
        from(fetchAuthSession()).pipe(
          map((session) => this.createSession(session.tokens, null))
        )
      ),
      tap((session) => {
        this._authStore.setSession(session);
        this._authStore.setLoading(false);
      }),
      catchError((err) => {
        this._authStore.setLoading(false);
        this._authStore.clearSession();
        return of(null);
      }),
      filter((session): session is AuthSession => !!session)
    );
  }

  private decodeToken(token: string | null): JwtPayload | null {
    try {
      return token ? jwtDecode<JwtPayload>(token) : null;
    } catch {
      return null;
    }
  }

  private createSession(tokens: any, user: any): AuthSession {
    return {
      tokens,
      user,
      timestamp: Date.now(),
    };
  }

  private isTokenExpiredSync(session: AuthSession): boolean {
    const token = session.tokens?.accessToken?.toString();
    const decoded = this.decodeToken(token);
    return !decoded || decoded.exp * 1000 <= Date.now();
  }

  private shouldRefreshSync(session: AuthSession): boolean {
    const token = session.tokens?.accessToken?.toString();
    const decoded = this.decodeToken(token);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : 0;
    return expiresAt - Date.now() < REFRESH_THRESHOLD_MS;
  }

  private startTokenCheck$(): void {
    interval(TOKEN_CHECK_INTERVAL_MS)
      .pipe(
        filter(() => !this._isLoggingOut()),
        filter(() => {
          const routePath = this._route.snapshot.firstChild?.routeConfig?.path;
          return !routePath?.includes('otp');
        }),
        takeUntilDestroyed(this._destroyRef),
        switchMap(() => this.runTokenCheck$())
      )
      .subscribe();
  }

  private runTokenCheck$(): Observable<void> {
    if (this._isLoggingOut()) return EMPTY;

    const session = this._authStore.getSession();
    if (!session?.tokens?.accessToken) {
      return this.refreshSession$().pipe(
        switchMap((s) => (s?.tokens?.accessToken ? EMPTY : this.logout$())),
        catchError(() => this.logout$())
      );
    }

    if (this.shouldRefreshSync(session)) {
      return this.refreshSession$().pipe(map(() => {}));
    }

    return EMPTY;
  }
}

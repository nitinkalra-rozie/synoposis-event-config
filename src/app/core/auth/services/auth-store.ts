import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthTokens, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, EMPTY, from, Observable, timer } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';

interface AuthSession {
  tokens: AuthTokens | null;
  user: any;
  timestamp: number;
}

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
const CACHE_DURATION_MS = 5 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  constructor() {
    this.startPeriodicRefresh();
  }
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _sessionCache$ = new BehaviorSubject<AuthSession | null>(
    null
  );

  private readonly _isLoading = signal<boolean>(false);

  getSession$(): Observable<AuthSession> {
    const cached = this._sessionCache$.value;

    if (cached && this.isSessionValid(cached)) {
      return this._sessionCache$.pipe(
        filter((session) => session !== null),
        map((session) => session!)
      );
    }

    return this.refreshSession$();
  }

  getAccessToken$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => session.tokens?.accessToken?.toString() || null),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  getIdToken$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => session.tokens?.idToken?.toString() || null),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  getUserEmail$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => {
        const user = session.user;
        return user?.signInDetails?.loginId || user?.username || null;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  isUserAdmin$(): Observable<boolean> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return false;

        const decoded: JwtPayload = jwtDecode(accessToken);
        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        return normalizedEmail?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ?? false;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return null;

        const decodedToken: JwtPayload = jwtDecode(accessToken);
        return decodedToken['cognito:groups'] || [];
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) return [null];

        const decodedToken: JwtPayload = jwtDecode(accessToken);
        const email = decodedToken.email || decodedToken.username;

        if (email && email.endsWith(SUPER_ADMIN_EMAIL_DOMAIN)) {
          return [UserRole.SUPERADMIN];
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
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  isTokenExpired$(): Observable<boolean> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return true;

        const decodedToken: JwtPayload = jwtDecode(accessToken);
        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();
        return currentTime >= expirationTime;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this.getSession$().pipe(
      tap((session) => {
        if (session.tokens?.accessToken) {
          this.logAllTokens(session.tokens);
        }
      }),
      map((session) => !!session.tokens?.accessToken),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  refreshSession$(): Observable<AuthSession> {
    if (this._isLoading()) {
      return this._sessionCache$.pipe(
        filter((session) => session !== null),
        map((session) => session!)
      );
    }

    this._isLoading.set(true);

    return from(fetchAuthSession()).pipe(
      switchMap((session) =>
        from(getCurrentUser()).pipe(
          map(
            (user) =>
              ({
                tokens: session.tokens || null,
                user,
                timestamp: Date.now(),
              }) as AuthSession
          ),
          catchError(() => [
            {
              tokens: session.tokens || null,
              user: null,
              timestamp: Date.now(),
            } as AuthSession,
          ])
        )
      ),
      tap((session) => {
        this._sessionCache$.next(session);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        this.clearCache();
        throw error;
      }),
      shareReplay(1)
    );
  }

  clearCache(): void {
    this._sessionCache$.next(null);
  }

  getCachedSession(): AuthSession | null {
    const cached = this._sessionCache$.value;
    return cached && this.isSessionValid(cached) ? cached : null;
  }

  isLoading(): boolean {
    return this._isLoading();
  }

  private isSessionValid(session: AuthSession): boolean {
    const accessToken = session.tokens?.accessToken?.toString();
    if (!accessToken) return false;

    const decoded: JwtPayload = jwtDecode(accessToken);
    return decoded.exp * 1000 > Date.now();
  }

  private shouldRefreshSession(session: AuthSession): boolean {
    const accessToken = session.tokens?.accessToken?.toString();
    if (!accessToken) return true;
    const decoded: JwtPayload = jwtDecode(accessToken);
    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    return expiresAt - now < REFRESH_THRESHOLD_MS;
  }

  private startPeriodicRefresh(): void {
    timer(60000, 60000)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        switchMap(() => {
          const cached = this._sessionCache$.value;
          if (cached && this.shouldRefreshSession(cached)) {
            return this.refreshSession$().pipe(catchError(() => EMPTY));
          }

          return EMPTY;
        })
      )
      .subscribe();
  }

  private logAllTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      jwtDecode(tokens.accessToken.toString());
    }
    if (tokens.idToken) {
      jwtDecode(tokens.idToken.toString());
    }
  }
}

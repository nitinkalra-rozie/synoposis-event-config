import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthTokens, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, EMPTY, Observable, of, timer } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AuthSession } from 'src/app/core/auth/data-service/auth-data-model';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
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
    return this._sessionCache$.pipe(
      switchMap((cached) => {
        if (cached && this.isSessionValidSync(cached)) {
          return of(cached);
        }
        return this.refreshSession$();
      }),
      filter((session): session is AuthSession => session !== null)
    );
  }

  getAccessToken$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => session.tokens?.accessToken?.toString() || null)
    );
  }

  getIdToken$(): Observable<string | null> {
    return this.getSession$().pipe(
      map((session) => session.tokens?.idToken?.toString() || null)
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

  isUserAdmin$(): Observable<boolean> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return false;

        const decoded = this.decodeToken(accessToken);
        if (!decoded) return false;

        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        return normalizedEmail?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ?? false;
      })
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return null;

        const decodedToken = this.decodeToken(accessToken);
        if (!decodedToken) return [];

        return decodedToken['cognito:groups'] || [];
      })
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return null;

        const decodedToken = this.decodeToken(accessToken);
        if (!decodedToken) return UserRole.EDITOR;

        const email = decodedToken.email || decodedToken.username;

        if (email && email.endsWith(SUPER_ADMIN_EMAIL_DOMAIN)) {
          return UserRole.SUPERADMIN;
        }

        const groups = decodedToken['cognito:groups'] || [];

        if (groups.some((group) => group.includes('SUPER_ADMIN'))) {
          return UserRole.SUPERADMIN;
        } else if (groups.some((group) => group.includes('ADMIN'))) {
          return UserRole.ADMIN;
        } else if (groups.some((group) => group.includes('EVENT_ORGANIZER'))) {
          return UserRole.EVENTORGANIZER;
        }

        return UserRole.EDITOR;
      }),
      distinctUntilChanged()
    );
  }

  isTokenExpired$(): Observable<boolean> {
    return this.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) return true;

        const decodedToken = this.decodeToken(accessToken);
        if (!decodedToken) return true;

        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();
        return currentTime >= expirationTime;
      })
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this.getSession$().pipe(
      tap((session) => {
        if (session.tokens?.accessToken) {
          this.logAllTokens(session.tokens);
        }
      }),
      map((session) => !!session.tokens?.accessToken)
    );
  }

  refreshSession$(): Observable<AuthSession> {
    if (this._isLoading()) {
      return this._sessionCache$.pipe(
        filter((session): session is AuthSession => session !== null)
      );
    }

    this._isLoading.set(true);

    return new Observable<AuthSession>((observer) => {
      fetchAuthSession()
        .then((session) => {
          getCurrentUser()
            .then((user) => {
              const authSession = this.createAuthSession(
                session.tokens || null,
                user,
                Date.now()
              );
              this._sessionCache$.next(authSession);
              this._isLoading.set(false);
              observer.next(authSession);
              observer.complete();
            })
            .catch(() => {
              const authSession = this.createAuthSession(
                session.tokens || null,
                null,
                Date.now()
              );
              this._sessionCache$.next(authSession);
              this._isLoading.set(false);
              observer.next(authSession);
              observer.complete();
            });
        })
        .catch((error) => {
          this._isLoading.set(false);
          this.clearCache();
          observer.error(error);
        });
    });
  }

  clearCache(): void {
    this._sessionCache$.next(null);
  }

  getCachedSession(): AuthSession | null {
    const cached = this._sessionCache$.value;
    return cached && this.isSessionValidSync(cached) ? cached : null;
  }

  isLoading(): boolean {
    return this._isLoading();
  }

  private createAuthSession(
    tokens: any,
    user: any,
    timestamp: number
  ): AuthSession {
    return {
      tokens,
      user,
      timestamp,
    };
  }

  private decodeToken(token: string): JwtPayload | null {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded || null;
  }

  private isSessionValidSync(session: AuthSession): boolean {
    const accessToken = session.tokens?.accessToken?.toString();
    if (!accessToken) return false;

    const decoded = this.decodeToken(accessToken);
    if (!decoded) return false;

    return decoded.exp * 1000 > Date.now();
  }

  private shouldRefreshSessionSync(session: AuthSession): boolean {
    const accessToken = session.tokens?.accessToken?.toString();
    if (!accessToken) return true;

    const decoded = this.decodeToken(accessToken);
    if (!decoded) return true;

    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    return expiresAt - now < REFRESH_THRESHOLD_MS;
  }

  private startPeriodicRefresh(): void {
    timer(60000, 60000)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map(() => this._sessionCache$.value),
        filter((cached) => !!cached && this.shouldRefreshSessionSync(cached)),
        mergeMap(() => this.refreshSession$().pipe(catchError(() => EMPTY)))
      )
      .subscribe();
  }

  private logAllTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      this.decodeToken(tokens.accessToken.toString());
    }
    if (tokens.idToken) {
      this.decodeToken(tokens.idToken.toString());
    }
  }
}

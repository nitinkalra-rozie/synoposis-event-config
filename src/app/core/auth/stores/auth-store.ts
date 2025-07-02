import { computed, Injectable, signal } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { from, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { AuthSession } from 'src/app/core/auth/models/auth.model';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export type TokenStatus =
  | 'valid'
  | 'expired'
  | 'refreshing'
  | 'invalid'
  | 'near-expiry';

interface AuthState {
  session: AuthSession | null;
  tokenStatus: TokenStatus;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  lastActivity: number;
  sessionExpiry: number | null;
  refreshInProgress: boolean;
  isLoggingOut: boolean;
}

const initialState: AuthState = {
  session: null,
  tokenStatus: 'invalid',
  userRole: null,
  isAuthenticated: false,
  lastActivity: Date.now(),
  sessionExpiry: null,
  refreshInProgress: false,
  isLoggingOut: false,
};

const state = {
  session: signal<AuthSession | null>(initialState.session),
  tokenStatus: signal<TokenStatus>(initialState.tokenStatus),
  userRole: signal<UserRole | null>(initialState.userRole),
  isAuthenticated: signal<boolean>(initialState.isAuthenticated),
  lastActivity: signal<number>(initialState.lastActivity),
  sessionExpiry: signal<number | null>(initialState.sessionExpiry),
  refreshInProgress: signal<boolean>(initialState.refreshInProgress),
  isLoggingOut: signal<boolean>(initialState.isLoggingOut),
};

const twoMinutesInMs = 2 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  public readonly $session = state.session.asReadonly();
  public readonly $tokenStatus = state.tokenStatus.asReadonly();
  public readonly $userRole = state.userRole.asReadonly();
  public readonly $isAuthenticated = state.isAuthenticated.asReadonly();
  public readonly $lastActivity = state.lastActivity.asReadonly();
  public readonly $sessionExpiry = state.sessionExpiry.asReadonly();
  public readonly $refreshInProgress = state.refreshInProgress.asReadonly();
  public readonly $isLoggingOut = state.isLoggingOut.asReadonly();

  public readonly $isTokenValid = computed(() =>
    ['valid', 'refreshing', 'near-expiry'].includes(state.tokenStatus())
  );

  public readonly $isTokenNearExpiry = computed(() => {
    const sessionExpiry = state.sessionExpiry();
    if (!sessionExpiry) {
      return false;
    }
    return Date.now() >= sessionExpiry - twoMinutesInMs;
  });

  private readonly _cacheDurationMs = 5000;

  invalidateCache(): void {
    this.resetState();
  }

  getSession(): AuthSession {
    const session = state.session();
    if (!session) {
      throw new Error('Session not available when requested');
    }
    return session;
  }

  updateSession(session: AuthSession): void {
    state.session.set(session);
    state.isAuthenticated.set(!!session.tokens?.accessToken);
    state.sessionExpiry.set(this._calculateSessionExpiry(session));
    state.lastActivity.set(Date.now());
    state.tokenStatus.set(!!session.tokens?.accessToken ? 'valid' : 'invalid');
  }

  setTokenStatus(status: TokenStatus): void {
    state.tokenStatus.set(status);
  }

  setUserRole(role: UserRole | null): void {
    state.userRole.set(role);
  }

  setRefreshInProgress(value: boolean): void {
    state.refreshInProgress.set(value);
  }

  setIsLoggingOut(value: boolean): void {
    state.isLoggingOut.set(value);
  }

  getSession$(): Observable<AuthSession> {
    const currentSession = state.session();
    const now = Date.now();
    if (
      currentSession &&
      now - currentSession.lastFetched < this._cacheDurationMs
    ) {
      return of(currentSession);
    }
    return this._fetchAndCacheSession$();
  }

  resetState(): void {
    state.session.set(initialState.session);
    state.tokenStatus.set(initialState.tokenStatus);
    state.userRole.set(initialState.userRole);
    state.isAuthenticated.set(initialState.isAuthenticated);
    state.lastActivity.set(Date.now());
    state.sessionExpiry.set(initialState.sessionExpiry);
    state.refreshInProgress.set(initialState.refreshInProgress);
    state.isLoggingOut.set(initialState.isLoggingOut);
  }

  private _fetchAndCacheSession$(): Observable<AuthSession> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const authSession: AuthSession = {
          tokens: session.tokens ?? null,
          isAuthenticated: !!session.tokens?.accessToken,
          lastFetched: Date.now(),
        };
        state.session.set(authSession);
        return authSession;
      }),
      catchError(() => {
        const errorSession = this._createUnauthenticatedSession();
        state.session.set(errorSession);
        return of(errorSession);
      }),
      shareReplay(1)
    );
  }

  private _createUnauthenticatedSession(): AuthSession {
    return {
      tokens: null,
      isAuthenticated: false,
      lastFetched: Date.now(),
    };
  }

  private _calculateSessionExpiry(session: AuthSession): number | null {
    const idTokenExp = session.tokens?.idToken?.payload?.exp;
    if (idTokenExp) {
      return idTokenExp * 1000;
    }
    return null;
  }
}

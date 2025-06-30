import { computed, Injectable, signal } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { from, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { AuthSession } from 'src/app/core/auth/data-service/auth.data-model';
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
}

const INITIAL_AUTH_STATE: AuthState = {
  session: null,
  tokenStatus: 'invalid',
  userRole: null,
  isAuthenticated: false,
  lastActivity: Date.now(),
  sessionExpiry: null,
  refreshInProgress: false,
};
@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  public readonly isAuthenticated$ = computed(
    () => this._state().isAuthenticated
  );
  public readonly tokenStatus$ = computed(() => this._state().tokenStatus);
  public readonly userRole$ = computed(() => this._state().userRole);
  public readonly sessionExpiry$ = computed(() => this._state().sessionExpiry);
  public readonly isTokenValid$ = computed(() =>
    ['valid', 'refreshing'].includes(this._state().tokenStatus)
  );

  private readonly _cacheDurationMs = 5000;
  private readonly _session = signal<AuthSession | null>(null);
  private readonly _state = signal<AuthState>(INITIAL_AUTH_STATE);

  invalidateCache(): void {
    this._session.set(null);
    this._resetAuthState();
  }

  getSession(): AuthSession {
    return this._state().session!;
  }

  updateSession(session: AuthSession): void {
    this._state.update((current) => ({
      ...current,
      session,
      isAuthenticated: !!session.tokens?.accessToken,
      sessionExpiry: this._calculateSessionExpiry(session),
      lastActivity: Date.now(),
      tokenStatus: !!session.tokens?.accessToken ? 'valid' : 'invalid',
    }));
  }

  getSession$(): Observable<AuthSession> {
    const currentSession = this._session();
    const now = Date.now();
    if (
      currentSession &&
      now - currentSession.lastFetched < this._cacheDurationMs
    ) {
      return of(currentSession);
    }
    return this._fetchAndCacheSession$();
  }

  private _fetchAndCacheSession$(): Observable<AuthSession> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const authSession: AuthSession = {
          tokens: session.tokens ?? null,
          isAuthenticated: !!session.tokens?.accessToken,
          lastFetched: Date.now(),
        };
        this._session.set(authSession);
        return authSession;
      }),
      catchError(() => {
        const errorSession = this._createUnauthenticatedSession();
        this._session.set(errorSession);
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

  private _resetAuthState(): void {
    this._state.set(INITIAL_AUTH_STATE);
  }

  private _calculateSessionExpiry(session: AuthSession): number | null {
    const idTokenExp = session.tokens?.idToken?.payload?.exp;
    if (idTokenExp) {
      return idTokenExp * 1000;
    }
    return null;
  }
}

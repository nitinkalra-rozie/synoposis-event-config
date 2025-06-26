import { Injectable, signal } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { from, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { AuthSession } from 'src/app/core/auth/data-service/auth.data-model';
@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly _cacheDurationMs = 30000;

  private readonly _session = signal<AuthSession | null>(null);

  invalidateCache(): void {
    this._session.set(null);
  }

  updateSession(session: AuthSession): void {
    this._session.set(session);
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

  forceRefreshSession$(): Observable<AuthSession> {
    return this._fetchAndCacheSession$(true);
  }

  private _fetchAndCacheSession$(
    forceRefresh: boolean = false
  ): Observable<AuthSession> {
    return from(fetchAuthSession({ forceRefresh })).pipe(
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
}

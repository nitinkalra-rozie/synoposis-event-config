import { Injectable, computed, signal } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Observable, from, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { AuthSession } from 'src/app/core/auth/data-service/auth.data-model';
@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  public readonly session = computed(() => this._session());
  public readonly isAuthenticated = computed(
    () => this._session()?.isAuthenticated ?? false
  );
  public readonly accessToken = computed(
    () => this._session()?.tokens?.accessToken?.toString() ?? null
  );
  public readonly idToken = computed(
    () => this._session()?.tokens?.idToken?.toString() ?? null
  );

  private readonly _cacheDurationMs = 30000;

  private readonly _session = signal<AuthSession | null>(null);
  invalidateCache(): void {
    this._session.set(null);
  }

  getSession$(): Observable<AuthSession> {
    const current = this._session();
    const now = Date.now();

    if (current && now - current.lastFetched < this._cacheDurationMs) {
      return of(current);
    }

    return this.fetchAndCacheSession$();
  }

  private createUnauthenticatedSession(): AuthSession {
    return {
      tokens: null,
      isAuthenticated: false,
      lastFetched: Date.now(),
    };
  }

  private fetchAndCacheSession$(): Observable<AuthSession> {
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
        const errorSession = this.createUnauthenticatedSession();
        this._session.set(errorSession);
        return of(errorSession);
      }),
      shareReplay(1)
    );
  }
}

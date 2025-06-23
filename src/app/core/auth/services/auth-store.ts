import { Injectable, signal } from '@angular/core';
import { AuthSession } from 'src/app/core/auth/data-service/auth.data-model';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  public readonly _session = signal<AuthSession | null>(null);
  public readonly _isLoading = signal<boolean>(false);

  public readonly $session = this._session.asReadonly();
  public readonly $isLoading = this._isLoading.asReadonly();

  setSession(session: AuthSession): void {
    this._session.set(session);
  }

  getSession(): AuthSession | null {
    return this._session();
  }

  clearSession(): void {
    this._session.set(null);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  isLoading(): boolean {
    return this._isLoading();
  }
}

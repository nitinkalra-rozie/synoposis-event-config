import { Injectable, Signal, signal } from '@angular/core';
import { DropdownOption } from '@syn/models';

@Injectable({
  providedIn: 'root',
})
export class SessionStateService {
  constructor() {
    this.availableSessions = this._availableSessionsSignal.asReadonly();
    this.activeSession = this._activeSessionSignal.asReadonly();
  }

  public readonly availableSessions: Signal<DropdownOption[]>;
  public readonly activeSession: Signal<DropdownOption | null>;

  private _availableSessionsSignal = signal<DropdownOption[]>([]);
  private _activeSessionSignal = signal<DropdownOption | null>(null);

  setAvailableSessions(sessions: DropdownOption[]): void {
    this._availableSessionsSignal.set(sessions);
  }

  setActiveSession(activeSession: DropdownOption): void {
    this._activeSessionSignal.set(activeSession);
  }
}

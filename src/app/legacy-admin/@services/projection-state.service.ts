import { Injectable, signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProjectionStateService {
  constructor() {
    this.isProjecting = this._isProjectingSignal.asReadonly();
  }

  public readonly isProjecting: Signal<Record<string, boolean>>;

  private _isProjectingSignal = signal<Record<string, boolean>>({});

  toggleProjectingState(identifier: string): void {
    let currentStatus = { ...this._isProjectingSignal() };
    currentStatus = {
      ...currentStatus,
      [identifier]: !currentStatus[identifier],
    };
    this._isProjectingSignal.set(currentStatus);
  }
}

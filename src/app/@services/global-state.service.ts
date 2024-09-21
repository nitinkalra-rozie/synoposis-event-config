import { Injectable, signal, Signal } from '@angular/core';
import { RightSidebarState } from '@syn/models';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  constructor() {
    this.rightSidebarState = this._rightSidebarStateSignal.asReadonly();
  }

  public readonly rightSidebarState: Signal<RightSidebarState>;

  private _rightSidebarStateSignal = signal<RightSidebarState>(
    RightSidebarState.Collapsed //todo: change to hidden
  );

  setRightSidebarState(state: RightSidebarState): void {
    this._rightSidebarStateSignal.set(state);
  }
}

import { Injectable, signal, Signal } from '@angular/core';
import { RightSidebarSelectedAction, RightSidebarState } from '@syn/models';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  constructor() {
    this.rightSidebarState = this._rightSidebarStateSignal.asReadonly();
    this.selectedRightSidebarAction =
      this._selectedRightSidebarActionSignal.asReadonly();
  }

  public readonly rightSidebarState: Signal<RightSidebarState>;
  public readonly selectedRightSidebarAction: Signal<RightSidebarSelectedAction>;

  private _rightSidebarStateSignal = signal<RightSidebarState>(
    RightSidebarState.Collapsed //todo: change to hidden
  );
  private _selectedRightSidebarActionSignal =
    signal<RightSidebarSelectedAction>(RightSidebarSelectedAction.None);

  setRightSidebarState(state: RightSidebarState): void {
    this._rightSidebarStateSignal.set(state);
  }

  setSelectedRightSidebarAction(state: RightSidebarSelectedAction): void {
    this._selectedRightSidebarActionSignal.set(state);
  }
}

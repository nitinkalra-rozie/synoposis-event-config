import { Injectable, signal, Signal } from '@angular/core';
import {
  DashboardTabs,
  RightSidebarSelectedAction,
  RightSidebarState,
} from '@syn/models';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  constructor() {
    this.rightSidebarState = this._rightSidebarStateSignal.asReadonly();
    this.selectedRightSidebarAction =
      this._selectedRightSidebarActionSignal.asReadonly();
    this.selectedDashboardTab = this._selectedDashboardTabSignal.asReadonly();
  }

  public readonly rightSidebarState: Signal<RightSidebarState>;
  public readonly selectedRightSidebarAction: Signal<RightSidebarSelectedAction>;
  public readonly selectedDashboardTab: Signal<DashboardTabs>;

  private _rightSidebarStateSignal = signal<RightSidebarState>(
    RightSidebarState.Hidden //todo: change to hidden
  );
  private _selectedRightSidebarActionSignal =
    signal<RightSidebarSelectedAction>(RightSidebarSelectedAction.None);
  private _selectedDashboardTabSignal = signal<DashboardTabs>(
    DashboardTabs.SessionSpecific
  );

  setRightSidebarState(state: RightSidebarState): void {
    this._rightSidebarStateSignal.set(state);
  }

  setSelectedRightSidebarAction(state: RightSidebarSelectedAction): void {
    if (
      this.rightSidebarState() === RightSidebarState.Collapsed &&
      state !== RightSidebarSelectedAction.None
    ) {
      this.setRightSidebarState(RightSidebarState.Expanded);
    }
    this._selectedRightSidebarActionSignal.set(state);
  }

  setSelectedDashboardTab(state: DashboardTabs): void {
    this._selectedDashboardTabSignal.set(state);
  }
}

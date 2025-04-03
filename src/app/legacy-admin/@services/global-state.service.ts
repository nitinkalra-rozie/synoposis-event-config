import { effect, Injectable, signal, Signal } from '@angular/core';
import {
  ControlPanelState,
  DashboardTabs,
  RightSidebarSelectedAction,
  RightSidebarState,
} from 'src/app/legacy-admin/@models/global-state';

@Injectable({
  providedIn: 'root',
})
export class GlobalStateService {
  constructor() {
    this.rightSidebarState = this._rightSidebarStateSignal.asReadonly();
    this.selectedRightSidebarAction =
      this._selectedRightSidebarActionSignal.asReadonly();
    this.selectedDashboardTab = this._selectedDashboardTabSignal.asReadonly();
    this.selectedDashboardTab = this._selectedDashboardTabSignal.asReadonly();
    this.controlPanelState = this._controlPanelStateSignal.asReadonly();

    effect(
      () => {
        if (
          this.selectedDashboardTab() === DashboardTabs.SessionSpecific &&
          this.controlPanelState() !== ControlPanelState.Default
        ) {
          this.setControlPanelState(ControlPanelState.Default);
        }
      },
      {
        allowSignalWrites: true,
      }
    );
  }

  public readonly rightSidebarState: Signal<RightSidebarState>;
  public readonly selectedRightSidebarAction: Signal<RightSidebarSelectedAction>;
  public readonly selectedDashboardTab: Signal<DashboardTabs>;
  public readonly controlPanelState: Signal<ControlPanelState>;

  private _rightSidebarStateSignal = signal<RightSidebarState>(
    RightSidebarState.Hidden
  );
  private _selectedRightSidebarActionSignal =
    signal<RightSidebarSelectedAction>(RightSidebarSelectedAction.None);
  private _selectedDashboardTabSignal = signal<DashboardTabs>(
    DashboardTabs.SessionSpecific
  );
  private _controlPanelStateSignal = signal<ControlPanelState>(
    ControlPanelState.Default
  );

  private _selectedDomainSignal = signal<string>('');

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

  setControlPanelState(state: ControlPanelState): void {
    this._controlPanelStateSignal.set(state);
  }
  setSelectedDomain(domain: string): void {
    this._selectedDomainSignal.set(domain);
  }

  getSelectedDomain(): string {
    return this._selectedDomainSignal();
  }
}

import { NgClass, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DropdownOption, RightSidebarState } from '@syn/models';
import {
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';
import {
  SynSingleSelectComponent,
  ProjectionImageComponent,
} from '@syn/components';

@Component({
  selector: 'app-session-selection',
  standalone: true,
  imports: [
    SynSingleSelectComponent,
    MatIconModule,
    NgOptimizedImage,
    NgTemplateOutlet,
    NgClass,
    ProjectionImageComponent,
  ],
  templateUrl: './session-selection.component.html',
  styleUrl: './session-selection.component.scss',
})
export class SessionSelectionComponent {
  protected availableSessions = computed(() =>
    this._dashboardFiltersStateService.availableSessions()
  );
  protected activeSession = computed(() =>
    this._dashboardFiltersStateService.activeSession()
  );
  protected rightSidebarState = computed(() =>
    this._globalState.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;

  //#region DI
  private _dashboardFiltersStateService = inject(DashboardFiltersStateService);
  private _globalState = inject(GlobalStateService);
  //#endregion

  protected onOptionSelect(selectedOption: DropdownOption): void {
    this._dashboardFiltersStateService.setActiveSession(selectedOption);
  }
}

import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventDetails } from '@syn/data-services';
import { RightSidebarSelectedAction, RightSidebarState } from '@syn/models';
import { FormatDatePipe, SelectedQuickActionHeaderTitlePipe } from '@syn/pipes';
import {
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';

@Component({
  selector: 'app-sidebar-control-panel',
  standalone: true,
  providers: [SelectedQuickActionHeaderTitlePipe, FormatDatePipe],
  imports: [
    NgClass,
    MatIconModule,
    MatTooltipModule,
    SelectedQuickActionHeaderTitlePipe,
    NgTemplateOutlet,
    FormatDatePipe,
  ],
  templateUrl: './sidebar-control-panel.component.html',
  styleUrl: './sidebar-control-panel.component.scss',
})
export class SidebarControlPanelComponent {
  protected rightSidebarState = computed<RightSidebarState>(() =>
    this._globalStateService.rightSidebarState()
  );
  protected selectedRightSidebarAction = computed<RightSidebarSelectedAction>(
    () => this._globalStateService.selectedRightSidebarAction()
  );
  protected liveEvent = computed<EventDetails>(() =>
    this._dashboardFiltersStateService.liveEvent()
  );

  protected RightSidebarState = RightSidebarState;
  protected RightSidebarSelectedAction = RightSidebarSelectedAction;

  private _globalStateService = inject(GlobalStateService);
  private _dashboardFiltersStateService = inject(DashboardFiltersStateService);

  protected onMenuItemClick(item: RightSidebarSelectedAction): void {
    this._globalStateService.setRightSidebarState(RightSidebarState.Expanded);
    this._globalStateService.setSelectedRightSidebarAction(item);
  }

  protected onCollapsePanel(): void {
    this._globalStateService.setRightSidebarState(RightSidebarState.Collapsed);
    this._globalStateService.setSelectedRightSidebarAction(
      RightSidebarSelectedAction.None
    );
  }
}

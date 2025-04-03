import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import {
  ControlPanelState,
  DashboardTabs,
  RightSidebarSelectedAction,
  RightSidebarState,
} from 'src/app/legacy-admin/@models/global-state';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { SoundAnimationComponent } from '../sound-animation/sound-animation.component';
import { EllipsisDirective } from 'src/app/legacy-admin/@directives/ellipsis.directive';


@Component({
  selector: 'app-control-panel',
  imports: [
    NgTemplateOutlet,
    MatIconModule,
    MatTooltipModule,
    EllipsisDirective,
    NgClass,
    SoundAnimationComponent
],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  public streamStarted = output();
  public streamPaused = output();
  public streamStopped = output();

  protected liveEvent = computed(() =>
    this._dashboardFiltersStateService.liveEvent()
  );
  protected liveEventState = computed(() =>
    this._dashboardFiltersStateService.liveEventState()
  );
  protected rightSidebarState = computed(() =>
    this._globalState.rightSidebarState()
  );
  protected selectedDashboardTab = computed(() =>
    this._globalState.selectedDashboardTab()
  );
  protected isWidgetViewExpanded = computed(
    () =>
      this._globalState.controlPanelState() === ControlPanelState.WidgetExpanded
  );
  protected RightSidebarState = RightSidebarState;
  protected DashboardTabs = DashboardTabs;
  protected LiveSessionState = LiveSessionState;

  protected isTitleOverflowing: boolean = false;

  //#region DI
  private _dashboardFiltersStateService = inject(DashboardFiltersStateService);
  private _globalState = inject(GlobalStateService);
  //#endregion

  protected onActionButtionClick(type: string): void {
    if (type === 'pause') {
      this.streamPaused.emit();
    } else if (type === 'resume') {
      this.streamStarted.emit();
    } else if (type === 'stop') {
      this.streamStopped.emit();
    } else if (type === 'view-transcript') {
      this._globalState.setSelectedRightSidebarAction(
        RightSidebarSelectedAction.Transcript
      );
    }
  }

  protected onViewAllClick(): void {
    this._globalState.setSelectedRightSidebarAction(
      RightSidebarSelectedAction.AllLiveSessions
    );
  }

  protected onSeeDetailsClick(): void {
    this._globalState.setSelectedRightSidebarAction(
      RightSidebarSelectedAction.SessionDetails
    );
  }

  protected onControlPanelClick(): void {
    if (
      this.selectedDashboardTab() !== DashboardTabs.ProjectSpecific ||
      this.isWidgetViewExpanded()
    ) {
      return;
    }

    this._globalState.setControlPanelState(ControlPanelState.WidgetExpanded);
  }

  protected onCollapseButtonClick(event: MouseEvent): void {
    event.stopPropagation();
    this._globalState.setControlPanelState(ControlPanelState.WidgetCollapsed);
  }
}

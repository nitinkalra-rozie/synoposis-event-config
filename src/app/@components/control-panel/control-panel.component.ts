import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LiveSessionState } from '@syn/data-services';
import { EllipsisDirective, OverflowDetectorDirective } from '@syn/directives';
import {
  ControlPanelState,
  DashboardTabs,
  RightSidebarSelectedAction,
  RightSidebarState,
} from '@syn/models';
import {
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';
import { SoundAnimationComponent } from '../sound-animation/sound-animation.component';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatIconModule,
    MatTooltipModule,
    OverflowDetectorDirective,
    EllipsisDirective,
    NgClass,
    SoundAnimationComponent,
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

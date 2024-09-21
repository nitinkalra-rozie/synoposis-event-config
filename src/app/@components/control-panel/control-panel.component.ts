import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisDirective, OverflowDetectorDirective } from '@syn/directives';
import { RightSidebarState } from '@syn/models';
import {
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';

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
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss',
})
export class ControlPanelComponent {
  protected liveEvent = computed(() =>
    this._dashboardFiltersStateService.liveEvent()
  );
  protected rightSidebarState = computed(() =>
    this._globalState.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;

  protected isTitleOverflowing: boolean = false;

  //#region DI
  private _dashboardFiltersStateService = inject(DashboardFiltersStateService);
  private _globalState = inject(GlobalStateService);
  //#endregion
}

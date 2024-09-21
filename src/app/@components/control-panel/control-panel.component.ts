import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EllipsisDirective, OverflowDetectorDirective } from '@syn/directives';
import { DashboardFiltersStateService } from '@syn/services';

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

  protected isTitleOverflowing: boolean = false;

  //#region DI
  private _dashboardFiltersStateService = inject(DashboardFiltersStateService);
  //#endregion
}

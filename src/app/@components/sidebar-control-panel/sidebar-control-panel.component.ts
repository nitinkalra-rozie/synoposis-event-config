import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RightSidebarState } from '@syn/models';
import { GlobalStateService } from '@syn/services';

@Component({
  selector: 'app-sidebar-control-panel',
  standalone: true,
  imports: [NgClass, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar-control-panel.component.html',
  styleUrl: './sidebar-control-panel.component.scss',
})
export class SidebarControlPanelComponent {
  protected rightSidebarState = computed<RightSidebarState>(() =>
    this._globalStateService.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;

  private _globalStateService = inject(GlobalStateService);

  protected onMenuItemClick(item: string): void {
    this._globalStateService.setRightSidebarState(RightSidebarState.Expanded);
  }

  protected onCollapsePanel(): void {
    this._globalStateService.setRightSidebarState(RightSidebarState.Collapsed);
  }
}

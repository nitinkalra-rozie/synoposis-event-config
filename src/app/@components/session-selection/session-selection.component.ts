import { NgClass, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
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
import { ModalService } from 'src/app/services/modal.service';

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
  public streamStarted = output();

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
  private _modalService = inject(ModalService);
  //#endregion

  private _liveEvent = computed(() =>
    this._dashboardFiltersStateService.liveEvent()
  );

  protected onOptionSelect(selectedOption: DropdownOption): void {
    this._dashboardFiltersStateService.setActiveSession(selectedOption);
  }

  protected onStartListening(): void {
    if (this._liveEvent()) {
      // show confirmation popup
      this._modalService.open(
        'End Session?',
        'You are currently listening to a session. Are you sure you want to end it and project a different screen?',
        'yes_no',
        () => {
          this._modalService.close();
          this._startStream();
        },
        () => {
          this._modalService.close();
        }
      );
    } else {
      this._startStream();
    }
  }

  protected onDropdownOpen(): void {
    // fetch latest event details
  }

  private _startStream(): void {
    this.streamStarted.emit();
  }
}

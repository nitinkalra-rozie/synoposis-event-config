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
import { ProjectionData } from '@syn/data-services';

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
  public streamStopped = output();
  public screenProjected = output<ProjectionData>();

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
      this._modalService.open(
        'End Session?',
        'You are currently listening to a session. Are you sure you want to end it and project a different screen?',
        'yes_no',
        () => {
          this._modalService.close();
          this._stopStream();
          setTimeout(() => {
            this._startStream();
          }, 300);
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

  protected onProjectToScreen(data: ProjectionData): void {
    this.screenProjected.emit(data);
  }

  private _startStream(): void {
    this.streamStarted.emit();
  }

  private _stopStream(): void {
    this.streamStopped.emit();
  }
}

import { NgClass, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
import { orderBy } from 'lodash-es';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { getInsightsDomainUrl } from '@syn/utils';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-session-selection',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    NgOptimizedImage,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    SynSingleSelectComponent,
    ProjectionImageComponent,
  ],
  templateUrl: './session-selection.component.html',
  styleUrl: './session-selection.component.scss',
})
export class SessionSelectionComponent {
  public streamStarted = output();
  public streamStopped = output();
  public screenProjected = output<ProjectionData>();

  protected get getSessionUrl(): string {
    return `${getInsightsDomainUrl()}/session/${this.activeSession().metadata['originalContent'].PrimarySessionId}`;
  }

  protected isProjectOnPhysicalScreen = signal(false);

  protected availableSessions = computed(() =>
    orderBy(
      this._dashboardFiltersStateService.availableSessions(),
      (session) => session.metadata['isIndicatorActive'],
      'desc'
    )
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
    this.isProjectOnPhysicalScreen.set(false);
  }

  protected openSessionInNewWindow(): void {
    const newWindow = window.open(
      this.getSessionUrl,
      '_blank',
      'toolbar=1,resizable=1'
    );
    newWindow.moveTo(0, 0);
    newWindow.resizeTo(screen.width, screen.height);
  }

  protected copyToClipboard(): void {
    navigator.clipboard.writeText(this.getSessionUrl);
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
    this._dashboardFiltersStateService.setShouldFetchEventDetails(true);
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

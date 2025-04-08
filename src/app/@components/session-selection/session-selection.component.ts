import { NgClass } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DropdownOption, RightSidebarState } from '@syn/models';
import {
  BrowserWindowService,
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';
import { SynSingleSelectComponent } from '@syn/components';
import { ModalService } from 'src/app/services/modal.service';
import { ProjectionData } from '@syn/data-services';
import { filter, orderBy } from 'lodash-es';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { getInsightsDomainUrl } from '@syn/utils';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BackendApiService } from 'src/app/services/backend-api.service';

@Component({
  selector: 'app-session-selection',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    SynSingleSelectComponent,
  ],
  templateUrl: './session-selection.component.html',
  styleUrl: './session-selection.component.scss',
})
export class SessionSelectionComponent {
  constructor() {
    this.isProjectOnPhysicalScreen.set(
      this._backendApiService.getCurrentEventName() === 'ITC'
    );
  }

  private readonly _backendApiService = inject(BackendApiService);
  private readonly _dashboardFiltersStateService = inject(
    DashboardFiltersStateService
  );
  private readonly _windowService = inject(BrowserWindowService);
  private readonly _globalState = inject(GlobalStateService);
  private readonly _modalService = inject(ModalService);

  public streamStarted = output();
  public streamStopped = output();
  public screenProjected = output<ProjectionData>();

  protected get getSessionUrl(): string {
    return `${getInsightsDomainUrl()}/session/${this.activeSession()?.metadata['originalContent'].PrimarySessionId}?isPrimaryScreen=true`;
  }

  protected isProjectOnPhysicalScreen = signal(false);

  protected availableSessions = computed(() =>
    filter(
      orderBy(
        this._dashboardFiltersStateService.availableSessions(),
        (session) => session.metadata['isIndicatorActive'],
        'desc'
      ),
      ({ metadata }) =>
        metadata['originalContent'].Status !== 'REVIEW_COMPLETE' &&
        metadata['originalContent'].Status !== 'UNDER_REVIEW'
    )
  );
  protected activeSession = computed(() =>
    this._dashboardFiltersStateService.activeSession()
  );
  protected rightSidebarState = computed(() =>
    this._globalState.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;

  private _liveEvent = computed(() =>
    this._dashboardFiltersStateService.liveEvent()
  );

  protected onOptionSelect(selectedOption: DropdownOption): void {
    this._dashboardFiltersStateService.setActiveSession(selectedOption);
    this.isProjectOnPhysicalScreen.set(true);
  }

  protected openSessionInNewWindow(): boolean {
    this._windowService.openInsightsSessionWindow(this.getSessionUrl);
    return false;
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

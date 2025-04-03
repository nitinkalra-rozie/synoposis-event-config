import { NgClass } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, orderBy } from 'lodash-es';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { ProjectionData } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { BrowserWindowService } from 'src/app/legacy-admin/@services/browser-window.service';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { getInsightsDomainUrl } from 'src/app/legacy-admin/@utils/get-domain-urls-util';
import { BackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';

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

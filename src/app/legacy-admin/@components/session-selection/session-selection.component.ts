import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, orderBy } from 'lodash-es';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { ProjectionData } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { EventWebsocketService } from 'src/app/legacy-admin/@data-services/web-socket/event-websocket.service';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { BrowserWindowService } from 'src/app/legacy-admin/@services/browser-window.service';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { getInsightsDomainUrl } from 'src/app/legacy-admin/@utils/get-domain-urls-util';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';

@Component({
  selector: 'app-session-selection',
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
export class SessionSelectionComponent implements OnChanges {
  constructor() {
    this.isProjectOnPhysicalScreen.set(
      this._backendApiService.getCurrentEventName() === 'ITC'
    );

    this._eventWebsocketService.sessionLiveListening$
      .pipe(takeUntil(this._destroy$))
      .subscribe((data) => {
        const sessionId = data?.sessionId;
        if (sessionId) {
          const activeSession =
            this.activeSession()?.metadata['originalContent'];

          if (activeSession && activeSession.SessionId !== sessionId) {
            this._stopStream();
            this._dashboardFiltersStateService.setActiveSession(null);
            this._dashboardFiltersStateService.setLiveEvent(null);
            console.log('Current session stopped.');
          }

          const sessionToSelect = this.availableSessions().find(
            (session) =>
              session.metadata['originalContent'].SessionId === sessionId
          );

          if (sessionToSelect) {
            this._dashboardFiltersStateService.setActiveSession(
              sessionToSelect
            );

            this._startStream();
          } else {
            console.warn('Session not found in available sessions:', sessionId);
          }
        }
      });
    this._eventWebsocketService.sessionEnd$
      .pipe(takeUntil(this._destroy$))
      .subscribe((data) => {
        const sessionId = data?.sessionId;
        const activeSession = this.activeSession()?.metadata['originalContent'];

        if (activeSession && activeSession.SessionId === sessionId) {
          this._stopStream();
          this._dashboardFiltersStateService.setActiveSession(null);
          this._dashboardFiltersStateService.setLiveEvent(null);
          console.log('Listening session stopped due to SESSION_END.');
        } else {
          console.log(
            'Session ID does not match the active session. No action taken.'
          );
        }
      });
  }

  public readonly autoAvEnabled = input(false);

  public readonly streamStarted = output();
  public readonly streamStopped = output();
  public readonly screenProjected = output<ProjectionData>();

  protected readonly availableSessions = computed(() =>
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
  protected readonly activeSession = computed(() =>
    this._dashboardFiltersStateService.activeSession()
  );
  protected readonly rightSidebarState = computed(() =>
    this._globalState.rightSidebarState()
  );
  protected readonly RightSidebarState = RightSidebarState;
  protected readonly selectedStage = computed(() =>
    this._dashboardFiltersStateService.selectedLocation()
  );
  private readonly _liveEvent = computed(() =>
    this._dashboardFiltersStateService.liveEvent()
  );

  private readonly _destroy$ = new Subject<void>();
  private readonly _backendApiService = inject(LegacyBackendApiService);
  private readonly _dashboardFiltersStateService = inject(
    DashboardFiltersStateService
  );
  private readonly _windowService = inject(BrowserWindowService);
  private readonly _globalState = inject(GlobalStateService);
  private readonly _modalService = inject(ModalService);
  private readonly _eventWebsocketService = inject(EventWebsocketService);

  protected isProjectOnPhysicalScreen = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['autoAvEnabled'].currentValue) {
      this.isProjectOnPhysicalScreen.set(false);
    }
  }

  protected get getSessionUrl(): string {
    const activeSession = this.activeSession();
    let sessionToUse = activeSession;

    if (!sessionToUse) {
      const now = new Date().getTime();
      sessionToUse = this.availableSessions()
        .filter((session) => {
          const sessionStartTime = new Date(
            session.metadata['originalContent'].StartTime
          ).getTime();
          return sessionStartTime > now;
        })
        .reduce((nearestSession, currentSession) => {
          const nearestTime = new Date(
            nearestSession.metadata['originalContent'].StartTime
          ).getTime();
          const currentTime = new Date(
            currentSession.metadata['originalContent'].StartTime
          ).getTime();
          return Math.abs(currentTime - now) < Math.abs(nearestTime - now)
            ? currentSession
            : nearestSession;
        }, this.availableSessions()[0]);
    }

    if (!sessionToUse) {
      console.warn('No sessions available to generate the session URL.');
      return '';
    }

    return `${getInsightsDomainUrl()}/session/${sessionToUse.metadata['originalContent'].PrimarySessionId}?isPrimaryScreen=true`;
  }

  protected onOptionSelect(selectedOption: DropdownOption): void {
    this._dashboardFiltersStateService.setActiveSession(selectedOption);
    this.isProjectOnPhysicalScreen.set(true);

    const sessionId =
      selectedOption.metadata['originalContent'].PrimarySessionId;
    this._updateBrowserWindowUrl(sessionId);
  }

  protected _updateBrowserWindowUrl(sessionId: string): void {
    const currentWindow = this._windowService.getCurrentWindow();
    if (currentWindow) {
      const newUrl = `${getInsightsDomainUrl()}/session/${sessionId}?isPrimaryScreen=true`;
      currentWindow.location.replace(newUrl);
      console.log(
        'Updated browser window URL for manual session change:',
        newUrl
      );
    }
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

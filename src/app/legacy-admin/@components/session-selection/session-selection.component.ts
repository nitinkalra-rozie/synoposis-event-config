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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, orderBy } from 'lodash-es';
import { CentralizedViewWebSocketMessage } from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-model';
import { CentralizedViewWebSocketFacade } from 'src/app/av-workspace/facade/centralized-view-websocket-facade';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { ProjectionData } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { EventStageWebSocketMessageData } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-model';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { BrowserWindowService } from 'src/app/legacy-admin/@services/browser-window.service';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { EventStageWebSocketStateService } from 'src/app/legacy-admin/@store/event-stage-web-socket-state.service';
import { getInsightsDomainUrl } from 'src/app/legacy-admin/@utils/get-domain-urls-util';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
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

    this._initializeStageWebSocketListeners();
    this._initializeCentralizedWebSocketListeners();
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

  private readonly _backendApiService = inject(LegacyBackendApiService);
  private readonly _dashboardFiltersStateService = inject(
    DashboardFiltersStateService
  );
  private readonly _windowService = inject(BrowserWindowService);
  private readonly _globalState = inject(GlobalStateService);
  private readonly _modalService = inject(ModalService);
  private readonly _eventStageWebSocketState = inject(
    EventStageWebSocketStateService
  );
  private readonly _centralizedWebSocketFacade = inject(
    CentralizedViewWebSocketFacade
  );

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

    if (this._eventStageWebSocketState.$autoAvEnabled()) {
      const sessionId =
        selectedOption.metadata['originalContent'].PrimarySessionId;
      const newUrl = `${getInsightsDomainUrl()}/session/${sessionId}?isPrimaryScreen=true`;
      this._windowService.openInsightsSessionWindow(newUrl);
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

  private _initializeStageWebSocketListeners(): void {
    toObservable(this._eventStageWebSocketState.$sessionLiveListening)
      .pipe(takeUntilDestroyed())
      .subscribe((data: EventStageWebSocketMessageData) => {
        if (!data?.sessionId) return;

        const currentStage = this.selectedStage()?.label;
        const targetStage = data?.stage;

        if (targetStage && currentStage && targetStage !== currentStage) return;

        this._handleSessionAutoSelection(data.sessionId, 'StageWebSocket');
      });

    toObservable(this._eventStageWebSocketState.$sessionEnd)
      .pipe(takeUntilDestroyed())
      .subscribe((data: EventStageWebSocketMessageData) => {
        if (!data?.sessionId) return;

        const activeSession = this.activeSession()?.metadata['originalContent'];
        if (activeSession && activeSession.SessionId === data.sessionId) {
          this._stopStream();
          this._dashboardFiltersStateService.setActiveSession(null);
          this._dashboardFiltersStateService.setLiveEvent(null);
        }
      });
  }

  private _initializeCentralizedWebSocketListeners(): void {
    this._centralizedWebSocketFacade.sessionLiveListening$
      .pipe(takeUntilDestroyed())
      .subscribe((message: CentralizedViewWebSocketMessage) => {
        this._handleCentralizedSessionCommand(message);
      });
    this._centralizedWebSocketFacade.sessionPaused$
      .pipe(takeUntilDestroyed())
      .subscribe((message: CentralizedViewWebSocketMessage) => {
        this._handleCentralizedSessionPause(message);
      });
  }

  private _handleCentralizedSessionPause(
    message: CentralizedViewWebSocketMessage
  ): void {
    const { stage, sessionId, eventName } = message;

    const currentEventName = this._backendApiService.getCurrentEventName();
    const currentStage = this.selectedStage();
    if (
      eventName !== currentEventName ||
      !currentStage ||
      currentStage.label !== stage
    )
      return;

    const activeSession = this.activeSession();
    if (
      activeSession &&
      activeSession.metadata['originalContent'].SessionId === sessionId
    ) {
      this._stopStream();
    }
  }

  private _handleCentralizedSessionCommand(
    message: CentralizedViewWebSocketMessage
  ): void {
    const { stage, sessionId, eventName } = message;
    const currentEventName = this._backendApiService.getCurrentEventName();
    if (eventName !== currentEventName) return;

    const currentStage = this.selectedStage();
    if (!currentStage || currentStage.label !== stage) return;

    if (!sessionId) return;

    this._handleSessionAutoSelection(sessionId, 'CentralizedView');
  }

  private _handleSessionAutoSelection(
    sessionId: string,
    source: 'StageWebSocket' | 'CentralizedView'
  ): void {
    const currentActive = this.activeSession();
    const currentAvailableSessions = this.availableSessions();
    const allSessions = this._dashboardFiltersStateService.allSessions();

    if (
      currentActive &&
      currentActive.metadata['originalContent'].SessionId !== sessionId
    ) {
      this._stopStream();
      this._dashboardFiltersStateService.setActiveSession(null);
    }

    let sessionToSelect = currentAvailableSessions.find(
      (session) => session.metadata['originalContent'].SessionId === sessionId
    );

    if (!sessionToSelect) {
      sessionToSelect = allSessions.find(
        (session) => session.metadata['originalContent'].SessionId === sessionId
      );
    }

    if (sessionToSelect) {
      this._dashboardFiltersStateService.setActiveSession(sessionToSelect);
      this.isProjectOnPhysicalScreen.set(true);

      if (this._eventStageWebSocketState.$autoAvEnabled()) {
        const primarySessionId =
          sessionToSelect.metadata['originalContent'].PrimarySessionId;
        const newUrl = `${getInsightsDomainUrl()}/session/${primarySessionId}?isPrimaryScreen=true`;
        this._windowService.openInsightsSessionWindow(newUrl);
      }

      this._startStream();
    } else {
      this._dashboardFiltersStateService.setShouldFetchEventDetails(true);
      this._retrySessionSelection(sessionId, source);
    }
  }

  private _retrySessionSelection(
    sessionId: string,
    source: 'StageWebSocket' | 'CentralizedView'
  ): void {
    const allSessions = this._dashboardFiltersStateService.allSessions();
    const sessionToSelect = allSessions.find(
      (session) => session.metadata['originalContent'].SessionId === sessionId
    );

    if (sessionToSelect) {
      this._dashboardFiltersStateService.setActiveSession(sessionToSelect);
      this.isProjectOnPhysicalScreen.set(true);
      this._startStream();
    }
  }
}

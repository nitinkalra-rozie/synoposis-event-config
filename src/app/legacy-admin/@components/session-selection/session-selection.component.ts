import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnChanges,
  OnDestroy,
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
import { catchError, EMPTY, finalize, tap } from 'rxjs';
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
import {
  IS_PROJECT_ON_PHYSICAL_SCREEN,
  SELECTED_SESSION,
} from 'src/app/legacy-admin/shared/local-storage-key-constants';

import {
  getLocalStorageItem,
  setLocalStorageItem,
} from 'src/app/shared/utils/local-storage-util';

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
export class SessionSelectionComponent implements OnChanges, OnDestroy {
  constructor() {
    // # when adding these that time automatic open the projected screen
    // this.isProjectOnPhysicalScreen.set(
    //   this._backendApiService.getCurrentEventName() === 'ITC'
    // );

    const currentStage = this.selectedStage()?.key;
    let savedToggleState: boolean | null = null;

    if (currentStage) {
      const stageSpecificKey = `${IS_PROJECT_ON_PHYSICAL_SCREEN}_${currentStage}`;
      savedToggleState = getLocalStorageItem<boolean>(stageSpecificKey);
    }

    if (savedToggleState === null || savedToggleState === undefined) {
      savedToggleState = getLocalStorageItem<boolean>(
        IS_PROJECT_ON_PHYSICAL_SCREEN
      );
    }

    this.isProjectOnPhysicalScreen.set(savedToggleState ?? false);

    this._previousStage = this.selectedStage()?.key || null;

    this._windowService.closeAllProjectionWindows();
    this._windowService.clearWindowCloseCallback();

    toObservable(this.availableSessions)
      .pipe(takeUntilDestroyed())
      .subscribe((sessions) => {
        if (sessions && sessions.length > 0) {
          const currentStage = this.selectedStage()?.key;
          if (currentStage) {
            this._restoreToggleState(currentStage);
          }

          this._restoreSelectedSession();
        }
      });

    toObservable(this._eventStageWebSocketState.$sessionLiveListening)
      .pipe(takeUntilDestroyed())
      .subscribe((data: EventStageWebSocketMessageData) => {
        const sessionId = data?.sessionId;
        if (sessionId) {
          const activeSession =
            this.activeSession()?.metadata['originalContent'];

          if (activeSession && activeSession.SessionId !== sessionId) {
            this._stopStream();
            this._dashboardFiltersStateService.setActiveSession(null);
            this._dashboardFiltersStateService.setLiveEvent(null);
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
          }
        }
      });

    toObservable(this._eventStageWebSocketState.$sessionEnd)
      .pipe(takeUntilDestroyed())
      .subscribe((data: EventStageWebSocketMessageData) => {
        const sessionId = data?.sessionId;
        const activeSession = this.activeSession()?.metadata['originalContent'];

        if (activeSession && activeSession.SessionId === sessionId) {
          this._stopStream();
          this._dashboardFiltersStateService.setActiveSession(null);
          this._dashboardFiltersStateService.setLiveEvent(null);
        }
      });

    toObservable(this.selectedStage)
      .pipe(takeUntilDestroyed())
      .subscribe((newStage) => {
        if (newStage) {
          this._handleStageChange(newStage);
          this._hasRestoredSession = false;
          this._restoreToggleState(newStage.key);
          setTimeout(() => {
            this._restoreSelectedSession();
          }, 100);
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

  protected isProjectOnPhysicalScreen = signal(false);
  protected _isToggleProcessing = signal(false);
  private _previousStage: string | null = null;
  private _hasRestoredSession = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['autoAvEnabled'].currentValue) {
      this.isProjectOnPhysicalScreen.set(false);
    }
  }

  ngOnDestroy(): void {
    this._windowService.clearWindowCloseCallback();
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
      return '';
    }

    return `${getInsightsDomainUrl()}/session/${sessionToUse.metadata['originalContent'].PrimarySessionId}?isPrimaryScreen=true`;
  }

  protected onOptionSelect(selectedOption: DropdownOption): void {
    this._dashboardFiltersStateService.setActiveSession(selectedOption);

    this._saveSelectedSession(selectedOption);

    if (this.isProjectOnPhysicalScreen()) {
      this._updateProjectionForCurrentSession();
    }
  }

  protected openSessionInNewWindow(): boolean {
    if (this.isProjectOnPhysicalScreen()) {
      this._openProjectionWindow();
      this._setupWindowCloseMonitoring();
    }
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

  protected onProjectingToggleChange(): void {
    if (this._isToggleProcessing()) {
      return;
    }

    const currentState = this.isProjectOnPhysicalScreen();
    const newProjectingState = !currentState;
    const eventName = this._backendApiService.getCurrentEventName();
    const stage = this.selectedStage()?.key;

    if (!eventName || !stage) {
      return;
    }

    if (!this.activeSession() && newProjectingState) {
      return;
    }

    this._isToggleProcessing.set(true);

    this.isProjectOnPhysicalScreen.set(newProjectingState);

    const currentStage = this.selectedStage()?.key;
    const toggleStorageKey = currentStage
      ? `${IS_PROJECT_ON_PHYSICAL_SCREEN}_${currentStage}`
      : IS_PROJECT_ON_PHYSICAL_SCREEN;

    setLocalStorageItem(toggleStorageKey, newProjectingState);

    if (!newProjectingState) {
      this._windowService.closeAllProjectionWindows();
      this._windowService.clearWindowCloseCallback();
    }

    this._backendApiService
      .setPrimaryScreenProjecting(
        'setPrimaryScreenProjecting',
        eventName,
        newProjectingState,
        stage
      )
      .pipe(
        tap(() => {
          this._isToggleProcessing.set(false);
        }),
        catchError(() => {
          this.isProjectOnPhysicalScreen.set(currentState);

          if (newProjectingState && !currentState) {
            this._windowService.closeAllProjectionWindows();
            this._windowService.clearWindowCloseCallback();
          }

          this._isToggleProcessing.set(false);
          return EMPTY;
        })
      )
      .subscribe();
  }

  private _setupWindowCloseMonitoring(): void {
    this._windowService.setWindowCloseCallback(() => {
      this._handleProjectingWindowClosed();
    });
  }

  private _handleProjectingWindowClosed(): void {
    this.isProjectOnPhysicalScreen.set(false);
    const currentStage = this.selectedStage()?.key;
    const toggleStorageKey = currentStage
      ? `${IS_PROJECT_ON_PHYSICAL_SCREEN}_${currentStage}`
      : IS_PROJECT_ON_PHYSICAL_SCREEN;

    setLocalStorageItem(toggleStorageKey, false);

    const eventName = this._backendApiService.getCurrentEventName();
    const stage = this.selectedStage()?.key;

    if (!eventName || !stage) {
      return;
    }

    this._backendApiService
      .setPrimaryScreenProjecting(
        'setPrimaryScreenProjecting',
        eventName,
        false,
        stage
      )
      .pipe(
        tap(() => {
          this._windowService.clearWindowCloseCallback();
        }),
        catchError(() => EMPTY)
      )
      .subscribe();
  }

  private _startStream(): void {
    this.streamStarted.emit();
  }

  private _stopStream(): void {
    this.streamStopped.emit();
  }

  private _openProjectionWindow(): void {
    const activeSession = this.activeSession();

    if (activeSession) {
      const sessionId =
        activeSession.metadata['originalContent'].PrimarySessionId;
      const projectionUrl = `${getInsightsDomainUrl()}/session/${sessionId}?isPrimaryScreen=true`;
      this._windowService.openInsightsSessionWindow(projectionUrl);
    } else {
      const stage = this.selectedStage()?.key;
      if (stage) {
        this._windowService.showInsightsProjectedWindow(stage);
      }
    }
  }

  private _updateProjectionForCurrentSession(): void {
    const activeSession = this.activeSession();
    if (activeSession) {
      const sessionId =
        activeSession.metadata['originalContent'].PrimarySessionId;
      const newUrl = `${getInsightsDomainUrl()}/session/${sessionId}?isPrimaryScreen=true`;
      this._windowService.openInsightsSessionWindow(newUrl);
    }
  }

  private _handleStageChange(newStage: DropdownOption): void {
    if (this._isToggleProcessing()) {
      return;
    }

    const newStageKey = newStage?.key;
    if (this._previousStage === newStageKey) {
      return;
    }

    const wasProjecting = this.isProjectOnPhysicalScreen();
    const eventName = this._backendApiService.getCurrentEventName();

    if (!eventName) {
      this._previousStage = newStageKey;
      return;
    }

    this._isToggleProcessing.set(true);

    this.isProjectOnPhysicalScreen.set(false);
    this._windowService.closeAllProjectionWindows();
    this._windowService.clearWindowCloseCallback();

    if (wasProjecting && this._previousStage) {
      this._backendApiService
        .setPrimaryScreenProjecting(
          'setPrimaryScreenProjecting',
          eventName,
          false,
          this._previousStage
        )
        .pipe(
          tap(() => {
            this._handleNewStageProjection(newStageKey, eventName);
          }),
          catchError(() => EMPTY)
        )
        .subscribe();
    } else {
      this._handleNewStageProjection(newStageKey, eventName);
    }
  }

  private _handleNewStageProjection(
    newStageKey: string | undefined,
    eventName: string
  ): void {
    if (!newStageKey) {
      this._isToggleProcessing.set(false);
      return;
    }

    this._backendApiService
      .setPrimaryScreenProjecting(
        'setPrimaryScreenProjecting',
        eventName,
        false,
        newStageKey
      )
      .pipe(
        tap(() => {
          this._previousStage = newStageKey;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this._isToggleProcessing.set(false);
        })
      )
      .subscribe();
  }

  private _saveSelectedSession(session: DropdownOption): void {
    const currentStage = this.selectedStage()?.key;
    const storageKey = currentStage
      ? `${SELECTED_SESSION}_${currentStage}`
      : SELECTED_SESSION;

    setLocalStorageItem(storageKey, {
      key: session.key,
      label: session.label,
      metadata: session.metadata,
    });
  }

  private _restoreSelectedSession(): void {
    if (this._hasRestoredSession) {
      return;
    }

    const currentStage = this.selectedStage()?.key;
    if (!currentStage) {
      return;
    }

    const stageSpecificKey = `${SELECTED_SESSION}_${currentStage}`;
    let savedSession = getLocalStorageItem<DropdownOption>(stageSpecificKey);

    if (!savedSession) {
      savedSession = getLocalStorageItem<DropdownOption>(SELECTED_SESSION);
    }

    if (!savedSession) {
      this._hasRestoredSession = true;
      return;
    }

    this._restoreToggleState(currentStage);

    const matchingSession = this.availableSessions().find(
      (session) => session.key === savedSession.key
    );

    if (matchingSession) {
      this._dashboardFiltersStateService.setActiveSession(matchingSession);
      this._hasRestoredSession = true;
    }
  }

  private _restoreToggleState(stageKey: string): void {
    const stageSpecificKey = `${IS_PROJECT_ON_PHYSICAL_SCREEN}_${stageKey}`;
    let savedToggleState = getLocalStorageItem<boolean>(stageSpecificKey);
    if (savedToggleState === null || savedToggleState === undefined) {
      savedToggleState = getLocalStorageItem<boolean>(
        IS_PROJECT_ON_PHYSICAL_SCREEN
      );
    }
    this.isProjectOnPhysicalScreen.set(!!savedToggleState);
  }
}

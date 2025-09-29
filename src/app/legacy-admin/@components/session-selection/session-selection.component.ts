import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, orderBy } from 'lodash-es';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';
import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { API_ACTIONS } from 'src/app/legacy-admin/@constants/api-actions';
import { ProjectionData } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { SetPrimaryScreenProjectingResponse } from 'src/app/legacy-admin/@data-services/primary-screen-projecting/primary-screen-projecting.data-model';
import { PrimaryScreenProjectingDataService } from 'src/app/legacy-admin/@data-services/primary-screen-projecting/primary-screen-projecting.data-service';
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
export class SessionSelectionComponent implements OnDestroy {
  constructor() {
    this.isProjectOnPhysicalScreen.set(false);
    this._previousStage.set(this.selectedStage()?.key || null);
    this._windowService.closeProjectionWindow();
    this._windowService.clearWindowCloseCallback();

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

    effect(() => {
      const newStage = this.selectedStage();
      if (newStage) {
        this._handleStageChange(newStage);
      }
    });

    effect(() => {
      const previousAutoAvState = this._previousAutoAvState();

      if (previousAutoAvState === true) {
        const wasProjecting = this.isProjectOnPhysicalScreen();

        if (wasProjecting && !this.isToggleProcessing()) {
          this.isProjectOnPhysicalScreen.set(false);
          this._windowService.closeProjectionWindow();
          this._windowService.clearWindowCloseCallback();

          this._handleAutoAvProjectionDisable();
        }
      }
    });
  }

  public readonly streamStarted = output();
  public readonly streamStopped = output();
  public readonly screenProjected = output<ProjectionData>();
  public readonly isProjectionToggleDisabled = computed(
    () =>
      this.isToggleProcessing() ||
      (!this.autoAvEnabled() && this.activeSession() === null)
  );

  protected readonly availableSessions = computed(() =>
    filter(
      orderBy(
        this._dashboardFiltersStateService.availableSessions(),
        (session) => session.metadata['isIndicatorActive'],
        'desc'
      ),
      ({ metadata }) =>
        metadata['originalContent'].Status !== EventStatus.ReviewComplete &&
        metadata['originalContent'].Status !== EventStatus.UnderReview &&
        metadata['originalContent'].Status !== EventStatus.ProcessingInsights
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
  private readonly _primaryScreenProjectingService = inject(
    PrimaryScreenProjectingDataService
  );
  private readonly _destroyRef = inject(DestroyRef);

  private static readonly _stopProjecting = false;

  protected isProjectOnPhysicalScreen = signal(false);
  protected isToggleProcessing = signal(false);
  protected autoAvEnabled = computed(() =>
    this._eventStageWebSocketState.$autoAvEnabled()
  );

  private _previousStage = signal<string | null>(null);
  private _previousAutoAvState = signal<boolean>(false);

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

    if (this.isProjectOnPhysicalScreen()) {
      this._updateProjectionForCurrentSession();
    }
  }

  protected openSessionInNewWindow(): boolean {
    this._windowService.openInsightsSessionWindow(this.getSessionUrl);
    this._setupWindowCloseMonitoring();
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
    if (this.isToggleProcessing()) {
      return;
    }

    const currentState = this.isProjectOnPhysicalScreen();
    const newProjectingState = !currentState;
    const eventName = this._backendApiService.getCurrentEventName();
    const stage = this.selectedStage()?.key;

    if (!eventName || !stage) {
      return;
    }

    this.isToggleProcessing.set(true);

    if (newProjectingState) {
      this._setPrimaryScreenProjection(eventName, true, stage)
        .pipe(
          tap(() => {
            this.isProjectOnPhysicalScreen.set(true);
            this._setupWindowCloseMonitoring();
          }),
          catchError(() => {
            this.isProjectOnPhysicalScreen.set(false);
            return EMPTY;
          }),
          finalize(() => {
            this.isToggleProcessing.set(false);
          }),
          takeUntilDestroyed(this._destroyRef)
        )
        .subscribe();
    } else {
      this._setPrimaryScreenProjection(eventName, false, stage)
        .pipe(
          tap(() => {
            this.isProjectOnPhysicalScreen.set(false);
            this._windowService.closeProjectionWindow();
            this._windowService.clearWindowCloseCallback();
          }),
          catchError(() => {
            this.isProjectOnPhysicalScreen.set(true);
            return EMPTY;
          }),
          finalize(() => {
            this.isToggleProcessing.set(false);
          }),
          takeUntilDestroyed(this._destroyRef)
        )
        .subscribe();
    }
  }

  private _setupWindowCloseMonitoring(): void {
    this._windowService.setWindowCloseCallback(() => {
      this._handleProjectingWindowClosed();
    });
  }
  private _handleProjectingWindowClosed(): void {
    if (!this.isProjectOnPhysicalScreen() || this.isToggleProcessing()) {
      return;
    }

    this.isProjectOnPhysicalScreen.set(false);

    const eventName = this._backendApiService.getCurrentEventName();
    const stage = this.selectedStage()?.key;

    if (!eventName || !stage) {
      return;
    }

    this.isToggleProcessing.set(true);

    this._setPrimaryScreenProjection(
      eventName,
      SessionSelectionComponent._stopProjecting,
      stage
    )
      .pipe(
        tap(() => {
          this._windowService.clearWindowCloseCallback();
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isToggleProcessing.set(false);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private _startStream(): void {
    this.streamStarted.emit();
  }

  private _stopStream(): void {
    this.streamStopped.emit();
  }

  private _updateProjectionForCurrentSession(): void {
    if (!this.isProjectOnPhysicalScreen()) {
      return;
    }

    const activeSession = this.activeSession();
    if (activeSession) {
      const sessionId =
        activeSession.metadata['originalContent'].PrimarySessionId;
      const newUrl = `${getInsightsDomainUrl()}/session/${sessionId}?isPrimaryScreen=true`;
      this._windowService.openInsightsSessionWindow(newUrl);
    }
  }

  private _handleStageChange(newStage: DropdownOption): void {
    if (this.isToggleProcessing()) {
      return;
    }

    const newStageKey = newStage?.key;
    if (this._previousStage() === newStageKey) {
      return;
    }

    const wasProjecting = this.isProjectOnPhysicalScreen();
    const eventName = this._backendApiService.getCurrentEventName();

    if (!eventName) {
      this._previousStage.set(newStageKey);
      return;
    }

    this.isToggleProcessing.set(true);

    this.isProjectOnPhysicalScreen.set(false);
    this._windowService.closeProjectionWindow();
    this._windowService.clearWindowCloseCallback();

    if (wasProjecting && this._previousStage()) {
      this._setPrimaryScreenProjection(
        eventName,
        SessionSelectionComponent._stopProjecting,
        this._previousStage()
      )
        .pipe(
          tap(() => {
            this._handleNewStageProjection(newStageKey, eventName);
          }),
          catchError(() => EMPTY),
          takeUntilDestroyed(this._destroyRef)
        )
        .subscribe();
    } else {
      this._handleNewStageProjection(newStageKey, eventName);
    }
  }

  private _setPrimaryScreenProjection(
    eventName: string,
    isProjecting: boolean,
    stage: string
  ): Observable<SetPrimaryScreenProjectingResponse> {
    return this._primaryScreenProjectingService.setPrimaryScreenProjecting(
      API_ACTIONS.SET_PRIMARY_SCREEN_PROJECTING,
      eventName,
      isProjecting,
      stage
    );
  }

  private _handleNewStageProjection(
    newStageKey: string | undefined,
    eventName: string
  ): void {
    if (!newStageKey) {
      this.isToggleProcessing.set(false);
      return;
    }

    this._setPrimaryScreenProjection(
      eventName,
      SessionSelectionComponent._stopProjecting,
      newStageKey
    )
      .pipe(
        tap(() => {
          this._previousStage.set(newStageKey);
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.isToggleProcessing.set(false);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private _handleAutoAvProjectionDisable(): void {
    const eventName = this._backendApiService.getCurrentEventName();
    const stage = this.selectedStage()?.key;

    if (!eventName || !stage) {
      return;
    }

    this.isToggleProcessing.set(true);

    this._setPrimaryScreenProjection(eventName, false, stage)
      .pipe(
        catchError(() => EMPTY),
        finalize(() => {
          this.isToggleProcessing.set(false);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }
}

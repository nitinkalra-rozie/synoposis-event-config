import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  concatMap,
  finalize,
  forkJoin,
  Observable,
  of,
  take,
  tap,
  throwError,
} from 'rxjs';
import {
  CENTRALIZED_VIEW_DIALOG_MESSAGES,
  CENTRALIZED_VIEW_TOAST_MESSAGES,
} from 'src/app/av-workspace/constants/centralized-view-interaction-messages';
import { EventStagesDataService } from 'src/app/av-workspace/data-services/event-stages/event-stages-data-service';
import {
  EventStage,
  SessionStatusType,
  StageSessionsResponseData,
  StageStatusType,
} from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { SessionWithDropdownOptions } from 'src/app/av-workspace/models/sessions.model';
import { CentralizedViewUIStore } from 'src/app/av-workspace/stores/centralized-view-ui-store';
import { getValidProcessStagesForBulkActions } from 'src/app/av-workspace/utils/get-valid-process-stages-for-bulk-actions';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { SynConfirmDialogFacade } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog-facade';
import { SynToastFacade } from 'src/app/shared/components/syn-toast/syn-toast-facade';

interface EventStagesDataState {
  loading: boolean;
  error: string | null;
  entityIds: string[];
  sessionsByStage: Map<string, SessionWithDropdownOptions[]>;
  sessionLoadingStates: Map<string, boolean>;
  sessionErrors: Map<string, string | null>;
  startPauseResumeActionLoadingStates: Map<string, boolean>;
  bulkStartListeningLoading: boolean;
  bulkPauseListeningLoading: boolean;
  bulkEndListeningLoading: boolean;
}

const initialState: EventStagesDataState = {
  loading: false,
  error: null,
  entityIds: [],
  sessionsByStage: new Map(),
  sessionLoadingStates: new Map(),
  sessionErrors: new Map(),
  startPauseResumeActionLoadingStates: new Map(),
  bulkStartListeningLoading: false,
  bulkPauseListeningLoading: false,
  bulkEndListeningLoading: false,
};

const state = {
  loading: signal<boolean>(initialState.loading),
  error: signal<string | null>(initialState.error),
  entityIds: signal<string[]>(initialState.entityIds),
  sessionsByStage: signal<Map<string, SessionWithDropdownOptions[]>>(
    initialState.sessionsByStage
  ),
  sessionLoadingStates: signal<Map<string, boolean>>(
    initialState.sessionLoadingStates
  ),
  sessionErrors: signal<Map<string, string | null>>(initialState.sessionErrors),
  startPauseResumeActionLoadingStates: signal<Map<string, boolean>>(
    initialState.startPauseResumeActionLoadingStates
  ),
  bulkStartListeningLoading: signal<boolean>(
    initialState.bulkStartListeningLoading
  ),
  bulkPauseListeningLoading: signal<boolean>(
    initialState.bulkPauseListeningLoading
  ),
  bulkEndListeningLoading: signal<boolean>(
    initialState.bulkEndListeningLoading
  ),
};

@Injectable({
  providedIn: 'root',
})
export class EventStagesDataStore {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _eventStagesDataService = inject(EventStagesDataService);
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);
  private readonly _uiStore = inject(CentralizedViewUIStore);
  private readonly _confirmDialogFacade = inject(SynConfirmDialogFacade);
  private readonly _toastFacade = inject(SynToastFacade);

  private readonly _entitySignals = new Map<
    string,
    WritableSignal<EventStage>
  >();

  public $loading = state.loading.asReadonly();
  public $error = state.error.asReadonly();
  public $entityIds = state.entityIds.asReadonly();
  public $sessionLoadingStates = state.sessionLoadingStates.asReadonly();
  public $sessionErrors = state.sessionErrors.asReadonly();
  public $startPauseResumeActionLoadingStates =
    state.startPauseResumeActionLoadingStates.asReadonly();
  public $bulkStartListeningLoading =
    state.bulkStartListeningLoading.asReadonly();
  public $bulkPauseListeningLoading =
    state.bulkPauseListeningLoading.asReadonly();
  public $bulkEndListeningLoading = state.bulkEndListeningLoading.asReadonly();

  public $sessionsByStage = computed(() => {
    const sessionsByStage = state.sessionsByStage();
    const activeSessionStatuses = new Set(['IN_PROGRESS', 'NOT_STARTED']);
    return new Map(
      Array.from(sessionsByStage.entries(), ([stage, sessions]) => [
        stage,
        sessions.filter((session) =>
          activeSessionStatuses.has(session.session.Status)
        ),
      ])
    );
  });

  public $entities = computed(() => {
    const entityIds = state.entityIds();
    return entityIds
      .map((id) => this._entitySignals.get(id)?.())
      .filter((entity): entity is EventStage => entity !== undefined);
  });

  public $locations = computed(() => {
    const entities = this.$entities();
    const locations = new Set<string>();
    entities.forEach((stage) => {
      if (stage.location) {
        locations.add(stage.location);
      }
    });
    return Array.from(locations).sort();
  });

  public $displayedColumns = computed(() => {
    const hasLocations = this.$entities().some((stage) => stage.location);
    return [
      'select',
      'stage',
      ...(hasLocations ? ['location'] : []),
      'session',
      'status',
      'action',
    ];
  });

  updateEntityStatus(stageId: string, status: StageStatusType): void {
    this._updateEntity(stageId, (entity) => ({
      ...entity,
      status: status,
      isOnline: status !== 'OFFLINE',
      lastUpdatedAt: Date.now(),
    }));
  }

  updateEntitySession(
    stageId: string,
    sessionId: string,
    sessionStatus: 'selected' | 'live' | 'paused' | 'ended'
  ): void {
    this._updateEntity(stageId, (entity) => ({
      ...entity,
      currentSessionId:
        sessionStatus === 'selected' || sessionStatus === 'live'
          ? sessionId
          : entity.currentSessionId,
      currentAction:
        sessionStatus === 'selected'
          ? null
          : sessionStatus === 'live'
            ? 'SESSION_LIVE_LISTENING'
            : sessionStatus === 'paused'
              ? 'SESSION_LIVE_LISTENING_PAUSED'
              : 'SESSION_END',
      lastUpdatedAt: Date.now(),
    }));
  }

  updateEntityAutoAv(stageId: string, autoAv: boolean): void {
    this._updateEntity(stageId, (entity) => ({
      ...entity,
      autoAv,
      lastUpdatedAt: Date.now(),
    }));
  }

  updateSessionInStage(
    stageId: string,
    sessionId: string,
    sessionStatus: SessionStatusType
  ): void {
    state.sessionsByStage.update((currentMap) => {
      const sessionsForStage = currentMap.get(stageId);

      if (!sessionsForStage) {
        return currentMap;
      }

      const targetSession = sessionsForStage.find(
        (session) => session.value === sessionId
      );

      if (targetSession?.session.Status === sessionStatus) {
        return currentMap;
      }

      const updatedSessions = sessionsForStage.map((session) =>
        session.value === sessionId
          ? {
              ...session,
              session: {
                ...session.session,
                Status: sessionStatus,
              },
            }
          : session
      );

      const newMap = new Map(currentMap);
      newMap.set(stageId, updatedSessions);
      return newMap;
    });
  }

  fetchStages(): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      state.error.set('No event name available');
      return;
    }

    state.loading.set(true);
    state.error.set(null);

    this._eventStagesDataService
      .getEventStages({ action: 'getStageListWithSessions', eventName })
      .pipe(
        take(1),
        tap((response) => {
          if (response.success && response.data) {
            this._setEntities(response.data);
            this._setActiveSessions(response.data);
          } else {
            state.error.set('Failed to fetch stages');
          }
        }),
        catchError((error) => {
          state.error.set('Failed to fetch stages');
          return throwError(() => error);
        }),
        finalize(() => state.loading.set(false))
      )
      .subscribe();
  }

  fetchSessions(stage: string): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    const currentSessions = state.sessionsByStage();
    if (currentSessions.has(stage) && currentSessions.get(stage)?.length > 0) {
      return;
    }

    const currentLoadingStates = state.sessionLoadingStates();
    if (currentLoadingStates.get(stage) === true) {
      return;
    }

    this._fetchSingleStageSessions(stage, eventName);
  }

  startListeningStage(stage: string): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    const sessionId = this._entitySignals.get(stage)?.()?.currentSessionId;

    this._setStartPauseResumeActionLoadingState(stage, true);

    this._eventStagesDataService
      .startListeningSession({
        action: 'adminStartListening',
        eventName,
        processStages: [{ stage, sessionId }],
      })
      .pipe(
        take(1),
        tap((response) => {
          if (response.success) {
            this._updateEntity(stage, (entity) => ({
              ...entity,
              currentSessionId: sessionId,
              lastUpdatedAt: Date.now(),
            }));
            this._toastFacade.showSuccess(
              CENTRALIZED_VIEW_TOAST_MESSAGES.START_LISTENING,
              CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
            );
          }
        }),
        finalize(() =>
          this._setStartPauseResumeActionLoadingState(stage, false)
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  pauseListeningStage(stage: string): void {
    this._confirmDialogFacade
      .openConfirmDialog({
        title: CENTRALIZED_VIEW_DIALOG_MESSAGES.PAUSE.TITLE,
        message: CENTRALIZED_VIEW_DIALOG_MESSAGES.PAUSE.MESSAGE(stage),
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
      })
      .pipe(
        concatMap((result: boolean) => {
          if (!result) return of();

          const eventName = this._legacyBackendApiService.getCurrentEventName();
          if (!eventName) return of();

          const sessionId =
            this._entitySignals.get(stage)?.()?.currentSessionId;

          this._setStartPauseResumeActionLoadingState(stage, true);

          return this._eventStagesDataService
            .pauseListeningSession({
              action: 'adminPauseListening',
              eventName,
              processStages: [{ stage, sessionId }],
            })
            .pipe(
              take(1),
              tap((response) => {
                if (response.success) {
                  this._toastFacade.showSuccess(
                    CENTRALIZED_VIEW_TOAST_MESSAGES.PAUSE_LISTENING,
                    CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
                  );
                }
              }),
              finalize(() =>
                this._setStartPauseResumeActionLoadingState(stage, false)
              )
            );
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  endListeningStage(stage: string): void {
    this._confirmDialogFacade
      .openConfirmDialog({
        title: CENTRALIZED_VIEW_DIALOG_MESSAGES.END.TITLE,
        message: CENTRALIZED_VIEW_DIALOG_MESSAGES.END.MESSAGE(stage),
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
      })
      .pipe(
        concatMap((result: boolean) => {
          if (!result) return of();

          const eventName = this._legacyBackendApiService.getCurrentEventName();
          if (!eventName) return of();

          const sessionId =
            this._entitySignals.get(stage)?.()?.currentSessionId;

          return this._eventStagesDataService
            .endListeningSession({
              action: 'adminEndListening',
              eventName,
              processStages: [{ stage, sessionId }],
            })
            .pipe(
              take(1),
              tap((response) => {
                console.log('endSession response', response);
                if (response.success) {
                  this._updateEntity(stage, (entity) => ({
                    ...entity,
                    currentSessionId: null,
                    lastUpdatedAt: Date.now(),
                    currentAction: 'SESSION_END',
                    status: 'ONLINE',
                  }));
                  this._toastFacade.showSuccess(
                    CENTRALIZED_VIEW_TOAST_MESSAGES.END_LISTENING,
                    CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
                  );
                }
              })
            );
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  startListeningMultipleStages(stages: string[]): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    state.bulkStartListeningLoading.set(true);

    const validStagesToStartListening = getValidProcessStagesForBulkActions(
      stages,
      this._entitySignals,
      'start'
    );

    if (validStagesToStartListening.length === 0) {
      state.bulkStartListeningLoading.set(false);
      this._toastFacade.showWarning(
        CENTRALIZED_VIEW_TOAST_MESSAGES.NO_STAGES_TO_START_LISTENING,
        CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
      );
      return;
    }

    const processStages = validStagesToStartListening.map(
      ({ stage, sessionId }) => ({
        stage,
        sessionId,
      })
    );

    this._eventStagesDataService
      .startListeningSession({
        action: 'adminStartListening',
        eventName,
        processStages,
      })
      .pipe(
        take(1),
        tap((response) => {
          if (response.success) {
            processStages.forEach(({ stage, sessionId }) => {
              this._updateEntity(stage, (entity) => ({
                ...entity,
                currentSessionId: sessionId,
                lastUpdatedAt: Date.now(),
              }));
            });

            this._toastFacade.showSuccess(
              CENTRALIZED_VIEW_TOAST_MESSAGES.START_LISTENING_MULTIPLE_STAGES(
                processStages.length
              ),
              CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
            );
          }
        }),
        catchError((error) => {
          this._toastFacade.showError(
            CENTRALIZED_VIEW_TOAST_MESSAGES.START_LISTENING_MULTIPLE_STAGES_ERROR(
              processStages.length
            ),
            CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
          );
          return throwError(() => error);
        }),
        finalize(() => state.bulkStartListeningLoading.set(false)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  pauseListeningMultipleStages(stages: string[]): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    const validStagesToPause = getValidProcessStagesForBulkActions(
      stages,
      this._entitySignals,
      'pause'
    );

    if (validStagesToPause.length === 0) {
      this._toastFacade.showWarning(
        CENTRALIZED_VIEW_TOAST_MESSAGES.NO_STAGES_TO_PAUSE_LISTENING,
        CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
      );
      return;
    }

    const processStages = validStagesToPause.map(({ stage, sessionId }) => ({
      stage,
      sessionId,
    }));

    this._confirmDialogFacade
      .openConfirmDialog({
        title: CENTRALIZED_VIEW_DIALOG_MESSAGES.PAUSE_MULTIPLE.TITLE,
        message: CENTRALIZED_VIEW_DIALOG_MESSAGES.PAUSE_MULTIPLE.MESSAGE(
          processStages.length
        ),
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
      })
      .pipe(
        concatMap((result: boolean) => {
          if (!result) return of();

          state.bulkPauseListeningLoading.set(true);

          return this._eventStagesDataService
            .pauseListeningSession({
              action: 'adminPauseListening',
              eventName,
              processStages,
            })
            .pipe(
              take(1),
              tap((response) => {
                if (response.success) {
                  this._toastFacade.showSuccess(
                    CENTRALIZED_VIEW_TOAST_MESSAGES.PAUSE_LISTENING_MULTIPLE_STAGES(
                      processStages.length
                    ),
                    CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
                  );
                }
              }),
              catchError((error) => {
                this._toastFacade.showError(
                  CENTRALIZED_VIEW_TOAST_MESSAGES.PAUSE_LISTENING_MULTIPLE_STAGES_ERROR(
                    processStages.length
                  ),
                  CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
                );
                return throwError(() => error);
              }),
              finalize(() => state.bulkPauseListeningLoading.set(false))
            );
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  endListeningMultipleStages(stages: string[]): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    const validStagesToEnd = getValidProcessStagesForBulkActions(
      stages,
      this._entitySignals,
      'end'
    );

    if (validStagesToEnd.length === 0) {
      this._toastFacade.showWarning(
        CENTRALIZED_VIEW_TOAST_MESSAGES.NO_STAGES_TO_END_LISTENING,
        CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
      );
      return;
    }

    const processStages = validStagesToEnd.map(({ stage, sessionId }) => ({
      stage,
      sessionId,
    }));

    this._confirmDialogFacade
      .openConfirmDialog({
        title: CENTRALIZED_VIEW_DIALOG_MESSAGES.END_MULTIPLE.TITLE,
        message: CENTRALIZED_VIEW_DIALOG_MESSAGES.END_MULTIPLE.MESSAGE(
          processStages.length
        ),
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
      })
      .pipe(
        concatMap((result: boolean) => {
          if (!result) return of();

          state.bulkEndListeningLoading.set(true);

          return this._eventStagesDataService
            .endListeningSession({
              action: 'adminEndListening',
              eventName,
              processStages,
            })
            .pipe(
              take(1),
              tap((response) => {
                if (response.success) {
                  processStages.forEach(({ stage }) => {
                    this._updateEntity(stage, (entity) => ({
                      ...entity,
                      currentSessionId: null,
                      lastUpdatedAt: Date.now(),
                      currentAction: 'SESSION_END',
                      status: 'ONLINE',
                    }));
                  });

                  this._uiStore.clearAllSelectionsOfDisabledRows(
                    this.$entities()
                  );

                  this._toastFacade.showSuccess(
                    CENTRALIZED_VIEW_TOAST_MESSAGES.END_LISTENING_MULTIPLE_STAGES(
                      processStages.length
                    ),
                    CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
                  );
                }
              }),
              catchError((error) => {
                this._toastFacade.showError(
                  CENTRALIZED_VIEW_TOAST_MESSAGES.END_LISTENING_MULTIPLE_STAGES_ERROR(
                    processStages.length
                  ),
                  CENTRALIZED_VIEW_TOAST_MESSAGES.DURATION
                );
                return throwError(() => error);
              }),
              finalize(() => state.bulkEndListeningLoading.set(false))
            );
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  clearSessionsForStage(stage: string): void {
    const currentSessions = new Map(state.sessionsByStage());
    currentSessions.delete(stage);
    state.sessionsByStage.set(currentSessions);

    const currentLoadingStates = new Map(state.sessionLoadingStates());
    currentLoadingStates.delete(stage);
    state.sessionLoadingStates.set(currentLoadingStates);

    const currentErrors = new Map(state.sessionErrors());
    currentErrors.delete(stage);
    state.sessionErrors.set(currentErrors);
  }

  clearAllSessions(): void {
    state.sessionsByStage.set(new Map());
    state.sessionLoadingStates.set(new Map());
    state.sessionErrors.set(new Map());
  }

  reset(): void {
    state.loading.set(initialState.loading);
    state.error.set(initialState.error);
    state.entityIds.set(initialState.entityIds);
    state.sessionsByStage.set(new Map(initialState.sessionsByStage));
    state.sessionLoadingStates.set(new Map(initialState.sessionLoadingStates));
    state.sessionErrors.set(new Map(initialState.sessionErrors));
    state.startPauseResumeActionLoadingStates.set(
      new Map(initialState.startPauseResumeActionLoadingStates)
    );
    state.bulkStartListeningLoading.set(initialState.bulkStartListeningLoading);
    state.bulkPauseListeningLoading.set(initialState.bulkPauseListeningLoading);
    state.bulkEndListeningLoading.set(initialState.bulkEndListeningLoading);
    this._entitySignals.clear();
  }

  private _updateEntity(
    stageId: string,
    updater: (entity: EventStage) => EventStage
  ): void {
    const entitySignal = this._entitySignals.get(stageId);
    if (entitySignal) {
      entitySignal.update(updater);
    }
  }

  private _setStartPauseResumeActionLoadingState(
    stageId: string,
    isLoading: boolean
  ): void {
    const currentLoadingStates = new Map(
      state.startPauseResumeActionLoadingStates()
    );
    currentLoadingStates.set(stageId, isLoading);
    state.startPauseResumeActionLoadingStates.set(currentLoadingStates);
  }

  private _setEntities(entities: EventStage[]): void {
    this._entitySignals.clear();

    const entityIds: string[] = [];
    entities.forEach((entity) => {
      const stageId = entity.stage;
      entityIds.push(stageId);
      this._entitySignals.set(stageId, signal(entity));
    });

    state.entityIds.set(entityIds);
  }

  private _setActiveSessions(entities: EventStage[]): void {
    const stagesNeedSessions = entities
      .filter((entity) => !!entity.currentSessionId)
      .filter((entity) => {
        const currentSessions = this.$sessionsByStage();
        return (
          !currentSessions.has(entity.stage) ||
          currentSessions.get(entity.stage)?.length === 0
        );
      })
      .map((entity) => entity.stage);

    this._fetchSessionsInParallel(stagesNeedSessions);
  }

  private _fetchSessionsInParallel(stages: string[]): void {
    if (stages.length === 0) return;

    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    const currentLoadingStates = new Map(state.sessionLoadingStates());
    stages.forEach((stage) => currentLoadingStates.set(stage, true));
    state.sessionLoadingStates.set(currentLoadingStates);

    const currentErrors = new Map(state.sessionErrors());
    stages.forEach((stage) => currentErrors.delete(stage));
    state.sessionErrors.set(currentErrors);

    const sessionRequests$ = stages.map((stage) =>
      this._fetchSingleStageSessions$(stage, eventName)
    );

    forkJoin(sessionRequests$)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  private _fetchSingleStageSessions(stage: string, eventName: string): void {
    const newLoadingStates = new Map(state.sessionLoadingStates());
    newLoadingStates.set(stage, true);
    state.sessionLoadingStates.set(newLoadingStates);

    const currentErrors = new Map(state.sessionErrors());
    currentErrors.delete(stage);
    state.sessionErrors.set(currentErrors);

    this._fetchSingleStageSessions$(stage, eventName).subscribe();
  }

  private _fetchSingleStageSessions$(
    stage: string,
    eventName: string
  ): Observable<StageSessionsResponseData> {
    return this._eventStagesDataService
      .getStageSessions({ action: 'getSessionListForStage', eventName, stage })
      .pipe(
        take(1),
        tap((response) => {
          if (response.success && response.data) {
            const sessionsWithOptions: SessionWithDropdownOptions[] =
              response.data.map((session) => ({
                value: session.SessionId,
                label: session.SessionTitle,
                session: session,
              }));

            const currentSessions = new Map(state.sessionsByStage());
            currentSessions.set(stage, sessionsWithOptions);
            state.sessionsByStage.set(currentSessions);
          } else {
            const currentErrors = new Map(state.sessionErrors());
            currentErrors.set(stage, 'Failed to fetch sessions');
            state.sessionErrors.set(currentErrors);
          }
        }),
        catchError((error) => {
          const currentErrors = new Map(state.sessionErrors());
          currentErrors.set(
            stage,
            `Network error: ${error.message || 'Unknown error'}`
          );
          state.sessionErrors.set(currentErrors);
          return throwError(() => error);
        }),
        finalize(() => {
          const currentLoadingStates = new Map(state.sessionLoadingStates());
          currentLoadingStates.set(stage, false);
          state.sessionLoadingStates.set(currentLoadingStates);
        })
      );
  }
}

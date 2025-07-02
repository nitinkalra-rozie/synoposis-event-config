import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, take, tap, throwError } from 'rxjs';
import { EventStagesDataService } from 'src/app/av-workspace/data-services/event-stages/event-stages-data-service';
import {
  EventStage,
  StageStatusType,
} from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { SessionWithDropdownOptions } from 'src/app/av-workspace/models/sessions.model';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

interface EventStagesDataState {
  loading: boolean;
  error: string | null;
  entityIds: string[];
  sessionsByStage: Map<string, SessionWithDropdownOptions[]>;
  sessionLoadingStates: Map<string, boolean>;
  sessionErrors: Map<string, string | null>;
}

const initialState: EventStagesDataState = {
  loading: false,
  error: null,
  entityIds: [],
  sessionsByStage: new Map(),
  sessionLoadingStates: new Map(),
  sessionErrors: new Map(),
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
};

@Injectable({
  providedIn: 'root',
})
export class EventStagesDataStore {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _eventStagesDataService = inject(EventStagesDataService);
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);

  private readonly _entitySignals = new Map<
    string,
    WritableSignal<EventStage>
  >();

  public $loading = state.loading.asReadonly();
  public $error = state.error.asReadonly();
  public $entityIds = state.entityIds.asReadonly();
  public $sessionsByStage = state.sessionsByStage.asReadonly();
  public $sessionLoadingStates = state.sessionLoadingStates.asReadonly();
  public $sessionErrors = state.sessionErrors.asReadonly();

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
      lastUpdatedAt: Date.now(),
    }));
  }

  updateEntitySession(
    stageId: string,
    sessionId: string,
    sessionStatus: 'live' | 'paused' | 'ended'
  ): void {
    this._updateEntity(stageId, (entity) => ({
      ...entity,
      currentSessionId:
        sessionStatus === 'live' ? sessionId : entity.currentSessionId,
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
        tap((response) => {
          if (response.success && response.data) {
            this._setEntities(response.data);
          } else {
            state.error.set('Failed to fetch stages');
          }
        }),
        catchError((error) => {
          state.error.set('Failed to fetch stages');
          return throwError(() => error);
        }),
        finalize(() => state.loading.set(false)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  fetchSessions(stage: string): void {
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) return;

    const currentSessions = state.sessionsByStage();
    if (currentSessions.has(stage) && currentSessions.get(stage)!.length > 0) {
      return;
    }

    const currentLoadingStates = state.sessionLoadingStates();
    if (currentLoadingStates.get(stage) === true) {
      return;
    }

    const newLoadingStates = new Map(currentLoadingStates);
    newLoadingStates.set(stage, true);
    state.sessionLoadingStates.set(newLoadingStates);

    const currentErrors = new Map(state.sessionErrors());
    currentErrors.delete(stage);
    state.sessionErrors.set(currentErrors);

    this._eventStagesDataService
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
}

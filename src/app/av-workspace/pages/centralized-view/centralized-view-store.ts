import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, take, tap } from 'rxjs';
import { CentralizedViewWebSocketMessage } from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-model';
import { CentralizedViewWebSocketDataService } from 'src/app/av-workspace/data-services/centralized-view-websocket/centralized-view-websocket.data-service';
import { EventStagesDataService } from 'src/app/av-workspace/data-services/event-stages/event-stages-data-service';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { SessionWithDropdownOptions } from 'src/app/av-workspace/models/sessions.model';
import { CentralizedViewWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-websocket-store';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

interface CentralizedViewState {
  loading: WritableSignal<boolean>;
  entities: WritableSignal<EventStage[]>;
  searchTerm: WritableSignal<string>;
  locationFilters: WritableSignal<string[]>;
  error: WritableSignal<string | null>;
  selectedItems: WritableSignal<Set<EventStage>>;
  sessionsByStage: WritableSignal<Map<string, SessionWithDropdownOptions[]>>;
  sessionLoadingStates: WritableSignal<Map<string, boolean>>;
  sessionErrors: WritableSignal<Map<string, string | null>>;
  stageStatuses: WritableSignal<Map<string, string>>;
  sessionStates: WritableSignal<
    Map<
      string,
      {
        sessionId: string;
        status: 'live' | 'paused' | 'ended';
        stage: string;
      }
    >
  >;
  autoAvStates: WritableSignal<Map<string, boolean>>;
}

const state: CentralizedViewState = {
  loading: signal(false),
  entities: signal<EventStage[]>([]),
  searchTerm: signal(''),
  locationFilters: signal([]),
  error: signal(null),
  selectedItems: signal(new Set<EventStage>()),
  sessionsByStage: signal(new Map<string, SessionWithDropdownOptions[]>()),
  sessionLoadingStates: signal(new Map<string, boolean>()),
  sessionErrors: signal(new Map<string, string | null>()),
  stageStatuses: signal(new Map<string, string>()),
  sessionStates: signal(
    new Map<
      string,
      {
        sessionId: string;
        status: 'live' | 'paused' | 'ended';
        stage: string;
      }
    >()
  ),
  autoAvStates: signal(new Map<string, boolean>()),
};

@Injectable()
export class CentralizedViewStore {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _eventStagesDataService = inject(EventStagesDataService);
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);
  private readonly _webSocketDataService = inject(
    CentralizedViewWebSocketDataService
  );
  private readonly _webSocketStore = inject(CentralizedViewWebSocketStore);

  public $vm = computed(() => ({
    loading: state.loading.asReadonly(),
    entities: this._filteredEntities,
    searchTerm: state.searchTerm.asReadonly(),
    locationFilters: state.locationFilters.asReadonly(),
    displayedColumns: this._displayedColumns,
    locations: this._locations,
    totalCount: state.entities().length,
    filteredCount: this._filteredEntities().length,
    error: state.error.asReadonly(),
    selection: state.selectedItems.asReadonly(),
    isAllSelected: this._isAllSelected,
    isIndeterminate: this._isIndeterminate,
    hasSelection: this._hasSelection,
    selectionCount: this._selectionCount,
    sessionsByStage: state.sessionsByStage.asReadonly(),
    sessionLoadingStates: state.sessionLoadingStates.asReadonly(),
    sessionErrors: state.sessionErrors.asReadonly(),
    websocketConnected: this._webSocketStore.$isConnected,
    websocketConnecting: this._webSocketStore.$isConnecting,
    websocketError: this._webSocketStore.$error,
    stageStatuses: state.stageStatuses.asReadonly(),
    sessionStates: state.sessionStates.asReadonly(),
    autoAvStates: state.autoAvStates.asReadonly(),
  }));

  private _displayedColumns = computed(() => {
    const hasLocations = state.entities().some((stage) => stage.location);

    return [
      'select',
      'stage',
      ...(hasLocations ? ['location'] : []),
      'session',
      'status',
      'action',
      // TODO:@later implement the delete column after the MVP
      // 'delete',
    ];
  });

  private _filteredEntities = computed(() => {
    const entities = state.entities();
    const searchTerm = state.searchTerm().toLowerCase().trim();
    const locationFilters = state.locationFilters();

    let filtered = entities;

    if (searchTerm) {
      filtered = filtered.filter((stage) => {
        const stageMatch = stage.stage.toLowerCase().includes(searchTerm);

        const locationMatch = stage?.location
          ?.toLowerCase()
          .includes(searchTerm);

        const sessionMatch = stage.sessions.some((session) =>
          session.SessionTitle.toLowerCase().includes(searchTerm)
        );

        return stageMatch || sessionMatch || locationMatch;
      });
    }

    if (locationFilters.length > 0) {
      filtered = filtered.filter((stage) =>
        stage.sessions.some((session) =>
          locationFilters.includes(session.Location)
        )
      );
    }

    return filtered;
  });

  private _locations = computed(() => {
    const entities = state.entities();
    const locations = new Set<string>();

    entities.forEach((stage) => {
      if (stage.location) {
        locations.add(stage.location);
      }
    });

    return Array.from(locations).sort();
  });

  private _isAllSelected = computed(() => {
    const filteredEntities = this._filteredEntities();

    if (filteredEntities.length === 0) return false;

    return filteredEntities.every((entity) =>
      state.selectedItems().has(entity)
    );
  });

  private _isIndeterminate = computed(() => {
    const filteredEntities = this._filteredEntities();
    const selectedEntities = state.selectedItems();

    if (filteredEntities.length === 0) return false;

    const selectedCount = filteredEntities.filter((entity) =>
      selectedEntities.has(entity)
    ).length;

    return selectedCount > 0 && selectedCount < filteredEntities.length;
  });

  private _hasSelection = computed(() => state.selectedItems().size > 0);

  private _selectionCount = computed(() => state.selectedItems().size);

  setSearchTerm(searchTerm: string): void {
    state.searchTerm.set(searchTerm);
  }

  setLocationFilters(locations: string[]): void {
    state.locationFilters.set(locations);
  }

  clearFilters(): void {
    state.searchTerm.set('');
    state.locationFilters.set([]);
  }

  toggleAllRows(): void {
    const filteredEntities = this._filteredEntities();
    const currentSelection = state.selectedItems();

    if (this._isAllSelected()) {
      const newSelected = new Set<EventStage>(
        [...currentSelection].filter(
          (entity) => !filteredEntities.includes(entity)
        )
      );
      state.selectedItems.set(newSelected);
    } else {
      const newSelected = new Set<EventStage>([
        ...currentSelection,
        ...filteredEntities.filter((entity) => !currentSelection.has(entity)),
      ]);
      state.selectedItems.set(newSelected);
    }
  }

  toggleRow(row: EventStage): void {
    const currentSelection = state.selectedItems();
    const newSelected = new Set(currentSelection);

    if (newSelected.has(row)) {
      newSelected.delete(row);
    } else {
      newSelected.add(row);
    }

    state.selectedItems.set(newSelected);
  }

  fetchStages(): void {
    // TODO:SYN-644: Move the event name to the event config store
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      state.error.set('No event name available');
      return;
    }

    state.loading.set(true);
    state.error.set(null);

    this._eventStagesDataService
      .getEventStages({
        action: 'getStageListWithSessions',
        eventName,
      })
      .pipe(
        take(1),
        tap({
          next: (response) => {
            if (response?.success) {
              state.entities.set(response.data);
              state.error.set(null);
            } else {
              state.error.set('Failed to load stages');
              state.entities.set([]);
            }
          },
          error: (error) => {
            console.error('Error loading event stages:', error);
            const errorMessage = error?.message || 'Failed to load stages';
            state.error.set(`Unable to load stages: ${errorMessage}`);
            state.entities.set([]);
          },
        }),
        finalize(() => state.loading.set(false))
      )
      .subscribe();
  }

  fetchSessions(stage: string): void {
    // TODO:SYN-644: Move the event name to the event config store
    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      state.error.set('No event name available');
      return;
    }

    const cachedSessions = state.sessionsByStage().get(stage);
    const isCurrentlyLoading = state.sessionLoadingStates().get(stage);

    if (!cachedSessions && !isCurrentlyLoading) {
      state.sessionLoadingStates.set(
        new Map(state.sessionLoadingStates()).set(stage, true)
      );
    }

    this._eventStagesDataService
      .getStageSessions({
        action: 'getSessionListForStage',
        eventName,
        stage,
      })
      .pipe(
        take(1),
        filter(() => !cachedSessions && !isCurrentlyLoading),
        tap({
          next: (response) => {
            if (response?.success) {
              const newSessions = response.data.map((session) => ({
                value: session.SessionId,
                label: session.SessionTitle,
                session,
              }));
              state.sessionsByStage.set(
                new Map(state.sessionsByStage()).set(stage, newSessions)
              );
            } else {
              state.sessionErrors.set(
                new Map(state.sessionErrors()).set(
                  stage,
                  'Failed to load sessions'
                )
              );
            }
          },
          error: (error) => {
            console.error('Error loading sessions:', error);
            const errorMessage = error?.message || 'Failed to load sessions';
            state.error.set(`Unable to load sessions: ${errorMessage}`);
            state.sessionErrors.set(
              new Map(state.sessionErrors()).set(stage, errorMessage)
            );
          },
        }),
        finalize(() => {
          state.sessionLoadingStates.set(
            new Map(state.sessionLoadingStates()).set(stage, false)
          );
        })
      )
      .subscribe();
  }

  // #region TODO:SYN-644: Add a facade service layer for the WebSocket related functions
  initializeWebSocket(): void {
    if (
      this._webSocketStore.$isConnected() ||
      this._webSocketStore.$isConnecting()
    ) {
      console.warn('WebSocket already connected or connecting');
      return;
    }

    const eventName = this._legacyBackendApiService.getCurrentEventName();
    if (!eventName) {
      console.error('No event name available for WebSocket initialization');
      return;
    }

    console.log('Initializing WebSocket for event:', eventName);

    this._webSocketDataService
      .connect()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (message) => {
          // Handle WebSocket messages directly here
          this._handleWebSocketMessage(message);
        },
        error: (error) => {
          console.error('WebSocket connection failed:', error);
          this._webSocketStore.setError('Connection failed');
        },
      });
  }

  private _handleWebSocketMessage(
    message: CentralizedViewWebSocketMessage
  ): void {
    console.log('Handling WebSocket message in store:', message);

    switch (message.eventType) {
      case 'SESSION_LIVE_LISTENING':
        this._handleSessionLiveListening(message);
        break;
      case 'SESSION_LIVE_LISTENING_PAUSED':
        this._handleSessionPaused(message);
        break;
      case 'SESSION_END':
        this._handleSessionEnd(message);
        break;
      case 'SET_AUTOAV_SETUP':
        this._handleAutoAvSetup(message);
        break;
      case 'STAGE_STATUS_UPDATED':
        this._handleStageStatusUpdate(message);
        break;
      default:
        console.warn(
          'Unhandled WebSocket event type:',
          message.eventType,
          message
        );
    }
  }

  private _handleSessionLiveListening(
    message: CentralizedViewWebSocketMessage
  ): void {
    if (message.sessionId && message.stage) {
      const newSessionStates = new Map(state.sessionStates());
      newSessionStates.set(message.sessionId, {
        sessionId: message.sessionId,
        status: 'live',
        stage: message.stage,
      });
      state.sessionStates.set(newSessionStates);

      // Directly update entities with session info
      this._updateEntitiesForSession(message.sessionId, message.stage, 'live');
    }
  }

  private _handleSessionPaused(message: CentralizedViewWebSocketMessage): void {
    if (message.sessionId && message.stage) {
      const newSessionStates = new Map(state.sessionStates());
      const existingSession = newSessionStates.get(message.sessionId);
      if (existingSession) {
        newSessionStates.set(message.sessionId, {
          ...existingSession,
          status: 'paused',
        });
        state.sessionStates.set(newSessionStates);

        // Directly update entities
        this._updateEntitiesForSession(
          message.sessionId,
          message.stage,
          'paused'
        );
      }
    }
  }

  private _handleSessionEnd(message: CentralizedViewWebSocketMessage): void {
    if (message.sessionId && message.stage) {
      const newSessionStates = new Map(state.sessionStates());
      const existingSession = newSessionStates.get(message.sessionId);
      if (existingSession) {
        newSessionStates.set(message.sessionId, {
          ...existingSession,
          status: 'ended',
        });
        state.sessionStates.set(newSessionStates);

        // Directly update entities
        this._updateEntitiesForSession(
          message.sessionId,
          message.stage,
          'ended'
        );
      }
    }
  }

  private _handleAutoAvSetup(message: CentralizedViewWebSocketMessage): void {
    if (message.stage && message.autoAv !== undefined) {
      const newAutoAvStates = new Map(state.autoAvStates());
      newAutoAvStates.set(message.stage, message.autoAv);
      state.autoAvStates.set(newAutoAvStates);

      // Directly update entities with autoAv info
      this._updateEntitiesForAutoAv(message.stage, message.autoAv);
    }
  }

  private _handleStageStatusUpdate(
    message: CentralizedViewWebSocketMessage
  ): void {
    if (message.stage && message.status) {
      const newStageStatuses = new Map(state.stageStatuses());
      newStageStatuses.set(message.stage, message.status);
      state.stageStatuses.set(newStageStatuses);

      // Directly update entities with new status
      this._updateEntitiesForStageStatus(message.stage, message.status);
    }
  }

  private _updateEntitiesForSession(
    sessionId: string,
    stage: string,
    sessionStatus: 'live' | 'paused' | 'ended'
  ): void {
    const currentEntities = state.entities();
    const updatedEntities = currentEntities.map((entity) => {
      if (entity.stage === stage) {
        const currentSessionId =
          sessionStatus === 'live' ? sessionId : entity.currentSessionId;
        return {
          ...entity,
          currentSessionId,
          lastUpdatedAt: Date.now(),
        };
      }
      return entity;
    });
    state.entities.set(updatedEntities);
  }

  private _updateEntitiesForAutoAv(stage: string, autoAv: boolean): void {
    const currentEntities = state.entities();
    const updatedEntities = currentEntities.map((entity) => {
      if (entity.stage === stage) {
        return {
          ...entity,
          autoAv,
          lastUpdatedAt: Date.now(),
        };
      }
      return entity;
    });
    state.entities.set(updatedEntities);
  }

  private _updateEntitiesForStageStatus(stage: string, status: string): void {
    const currentEntities = state.entities();
    const updatedEntities = currentEntities.map((entity) => {
      if (entity.stage === stage) {
        return {
          ...entity,
          status: status as any, // TODO:SYN-644: Map WebSocket status to StageStatus
          lastUpdatedAt: Date.now(),
        };
      }
      return entity;
    });
    state.entities.set(updatedEntities);
  }
  // #endregion TODO:SYN-644: Add a facade service layer for the WebSocket related functions
}

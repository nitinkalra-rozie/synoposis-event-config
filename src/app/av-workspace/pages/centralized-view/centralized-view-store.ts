import {
  computed,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { filter, take, tap } from 'rxjs';
import { EventStagesDataService } from 'src/app/av-workspace/data-services/event-stages/event-stages-data-service';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { SessionWithDropdownOptions } from 'src/app/av-workspace/models/sessions.model';
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
};

@Injectable()
export class CentralizedViewStore {
  private readonly _eventStagesDataService = inject(EventStagesDataService);
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);

  public $vm = computed(() => ({
    loading: state.loading,
    entities: this._filteredEntities,
    searchTerm: state.searchTerm,
    locationFilters: state.locationFilters,
    displayedColumns: this._displayedColumns,
    locations: this._locations,
    totalCount: state.entities().length,
    filteredCount: this._filteredEntities().length,
    error: state.error,
    selection: state.selectedItems,
    isAllSelected: this._isAllSelected,
    isIndeterminate: this._isIndeterminate,
    hasSelection: this._hasSelection,
    selectionCount: this._selectionCount,
    sessionsByStage: state.sessionsByStage,
    sessionLoadingStates: state.sessionLoadingStates,
    sessionErrors: state.sessionErrors,
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
            state.loading.set(false);
          },
          error: (error) => {
            console.error('Error loading event stages:', error);
            const errorMessage = error?.message || 'Failed to load stages';
            state.error.set(`Unable to load stages: ${errorMessage}`);
            state.entities.set([]);
            state.loading.set(false);
          },
        })
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
            state.sessionLoadingStates.set(
              new Map(state.sessionLoadingStates()).set(stage, false)
            );
          },
          error: (error) => {
            console.error('Error loading sessions:', error);
            const errorMessage = error?.message || 'Failed to load sessions';
            state.error.set(`Unable to load sessions: ${errorMessage}`);
            state.sessionErrors.set(
              new Map(state.sessionErrors()).set(stage, errorMessage)
            );
            state.sessionLoadingStates.set(
              new Map(state.sessionLoadingStates()).set(stage, false)
            );
          },
        })
      )
      .subscribe();
  }
}

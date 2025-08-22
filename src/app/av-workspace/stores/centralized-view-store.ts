import { computed, DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { CentralizedViewStage } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';
import { CentralizedViewWebSocketFacade } from 'src/app/av-workspace/facade/centralized-view-websocket-facade';
import { getSelectableEntities } from 'src/app/av-workspace/helpers/get-selectable-entities';
import { StageAutoAvToggleState } from 'src/app/av-workspace/models/stage-action-button-state.model';
import { CentralizedViewStagesDataStore } from 'src/app/av-workspace/stores/centralized-view-stages-data-store';
import { CentralizedViewUIStore } from 'src/app/av-workspace/stores/centralized-view-ui-store';
import { CentralizedViewWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-websocket-store';

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewStore {
  constructor() {
    this._initializeWebSocketSubscriptions();
  }

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _uiStore = inject(CentralizedViewUIStore);
  private readonly _dataStore = inject(CentralizedViewStagesDataStore);
  private readonly _webSocketStore = inject(CentralizedViewWebSocketStore);
  private readonly _webSocketFacade = inject(CentralizedViewWebSocketFacade);

  public $vm = computed(() => ({
    // Data state
    loading: this._dataStore.$loading,
    entities: this._filteredEntities,
    error: this._dataStore.$error,
    sessionsByStage: this._dataStore.$sessionsByStage,
    selectedSessionName: this._dataStore.$selectedSessionName,
    sessionLoadingStates: this._dataStore.$sessionLoadingStates,
    sessionErrors: this._dataStore.$sessionErrors,
    startPauseResumeActionLoadingStates:
      this._dataStore.$startPauseResumeActionLoadingStates,
    bulkStartListeningLoading: this._dataStore.$bulkStartListeningLoading,
    bulkPauseListeningLoading: this._dataStore.$bulkPauseListeningLoading,
    bulkEndListeningLoading: this._dataStore.$bulkEndListeningLoading,

    // UI state
    searchTerm: this._uiStore.$searchTerm,
    locationFilters: this._uiStore.$locationFilters,
    selectedStageIds: this._uiStore.$selectedStageIds,
    hasSelection: this._uiStore.$hasSelection,
    selectionCount: this._uiStore.$selectionCount,
    isSelectAllDisabled: this._isSelectAllDisabled,
    transcriptPanel: this._uiStore.$transcriptPanel,

    // Computed values
    displayedColumns: this._dataStore.$displayedColumns,
    locations: this._dataStore.$locations,
    totalCount: this._dataStore.$entities().length,
    filteredCount: this._filteredEntities().length,
    isAllSelected: computed(() =>
      this._uiStore.isAllSelected(this._filteredEntities())
    ),
    isIndeterminate: computed(() =>
      this._uiStore.isIndeterminate(this._filteredEntities())
    ),
    transcriptPanelCurrentAction: this._transcriptPanelCurrentAction,

    // WebSocket state
    websocketConnected: this._webSocketStore.$isConnected,
    websocketConnecting: this._webSocketStore.$isConnecting,
    websocketError: this._webSocketStore.$error,
  }));

  private _filteredEntities = computed(() => {
    const entities = this._dataStore.$entities();
    const searchTerm = this._uiStore.$searchTerm().toLowerCase().trim();
    const locationFilters = this._uiStore.$locationFilters();

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

  private _isSelectAllDisabled = computed(
    () =>
      !getSelectableEntities(this._filteredEntities()).length ||
      this._uiStore.$transcriptPanel().isOpen()
  );

  private _transcriptPanelCurrentAction = computed(() => {
    if (!this._uiStore.$transcriptPanel().isOpen()) {
      return 'SESSION_NOT_STARTED';
    }

    const stage = this._dataStore
      .$entities()
      .find(
        (entity) =>
          entity.stage === this._uiStore.$transcriptPanel().stageName()
      );
    return stage?.currentAction;
  });

  setSearchTerm(searchTerm: string): void {
    this._uiStore.setSearchTerm(searchTerm);
  }

  setLocationFilters(locations: string[]): void {
    this._uiStore.setLocationFilters(locations);
  }

  clearFilters(): void {
    this._uiStore.clearFilters();
  }

  toggleAllRows(): void {
    const filteredEntities = this._filteredEntities();
    this._uiStore.toggleAllRows(filteredEntities);
  }

  toggleRow(row: CentralizedViewStage): void {
    this._uiStore.toggleRow(row);
  }

  setSelectedSession(stage: string, sessionId: string): void {
    this._dataStore.updateEntitySession(stage, sessionId, 'selected');
  }

  fetchStages(): void {
    this._dataStore.fetchStages();
  }

  fetchSessions(stage: string): void {
    this._dataStore.fetchSessions(stage);
  }

  initializeWebSocket(): void {
    this._webSocketFacade.connect();
  }

  disconnectWebSocket(): void {
    this._webSocketFacade.disconnect();
  }

  startListeningStage(stage: string): void {
    this._dataStore.startListeningStage(stage);
  }

  pauseListeningStage(stage: string): void {
    this._dataStore.pauseListeningStage(stage);
  }

  stopListeningStage(stage: string): void {
    this._dataStore.endListeningStage(stage);
  }

  toggleAutoAvStage(payload: StageAutoAvToggleState): void {
    this._dataStore.toggleAutoAvStage(payload.stage, payload.isChecked);
  }

  startListeningMultipleStages(): void {
    this._dataStore.startListeningMultipleStages(
      Array.from(this._uiStore.$selectedStageIds())
    );
  }

  pauseListeningMultipleStages(): void {
    this._dataStore.pauseListeningMultipleStages(
      Array.from(this._uiStore.$selectedStageIds())
    );
  }

  endListeningMultipleStages(): void {
    this._dataStore.endListeningMultipleStages(
      Array.from(this._uiStore.$selectedStageIds())
    );
  }

  openTranscriptPanel(stageId: string): void {
    this._uiStore.selectRow(stageId);
    this._uiStore.openTranscriptPanel(stageId);
  }

  closeTranscriptPanel(): void {
    this._uiStore.clearSelection();
    this._uiStore.closeTranscriptPanel();
  }

  private _initializeWebSocketSubscriptions(): void {
    this._webSocketFacade.sessionLiveListening$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((message) => {
        if (message.sessionId && message.stage) {
          this._dataStore.updateEntitySession(
            message.stage,
            message.sessionId,
            'live'
          );
          this._dataStore.fetchSessions(message.stage);
        }
      });

    this._webSocketFacade.sessionPaused$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((message) => {
        if (message.sessionId && message.stage) {
          this._dataStore.updateEntitySession(
            message.stage,
            message.sessionId,
            'paused'
          );
        }
      });

    this._webSocketFacade.sessionEnd$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((message) => {
        if (message.stage && message.sessionId) {
          this._dataStore.updateEntitySession(
            message.stage,
            message.sessionId,
            'ended'
          );
          this._dataStore.updateSessionInStage(
            message.stage,
            message.sessionId,
            'UNDER_REVIEW'
          );
        }
      });

    this._webSocketFacade.autoAvSetup$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((message) => {
        if (message.stage && message.autoAv !== undefined) {
          this._dataStore.updateEntityAutoAv(message.stage, message.autoAv);
        }
      });

    this._webSocketFacade.stageStatusUpdate$
      .pipe(
        filter((message) => !!message.stage && !!message.status),
        map((message) =>
          this._dataStore.updateEntityStatus(message.stage, message.status)
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }
}

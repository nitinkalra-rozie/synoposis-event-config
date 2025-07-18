import { computed, Injectable, signal } from '@angular/core';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { getSelectableEntities } from 'src/app/av-workspace/utils/get-selectable-entities';

interface CentralizedViewUIState {
  searchTerm: string;
  locationFilters: string[];
  selectedStageIds: Set<string>;
}

const initialState: CentralizedViewUIState = {
  searchTerm: '',
  locationFilters: [],
  selectedStageIds: new Set<string>(),
};

const state = {
  searchTerm: signal<string>(initialState.searchTerm),
  locationFilters: signal<string[]>(initialState.locationFilters),
  selectedStageIds: signal<Set<string>>(initialState.selectedStageIds),
};

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewUIStore {
  public readonly $searchTerm = state.searchTerm.asReadonly();
  public readonly $locationFilters = state.locationFilters.asReadonly();
  public readonly $selectedStageIds = state.selectedStageIds.asReadonly();

  public readonly $hasSelection = computed(
    () => state.selectedStageIds().size > 0
  );
  public readonly $selectionCount = computed(
    () => state.selectedStageIds().size
  );

  setSearchTerm(searchTerm: string): void {
    state.searchTerm.set(searchTerm);
  }

  setLocationFilters(locations: string[]): void {
    state.locationFilters.set(locations);
  }

  clearFilters(): void {
    state.searchTerm.set(initialState.searchTerm);
    state.locationFilters.set(initialState.locationFilters);
  }

  toggleRow(row: EventStage): void {
    const currentSelection = state.selectedStageIds();
    const newSelected = new Set(currentSelection);

    if (newSelected.has(row.stage)) {
      newSelected.delete(row.stage);
    } else {
      newSelected.add(row.stage);
    }

    state.selectedStageIds.set(newSelected);
  }

  toggleAllRows(filteredEntities: readonly EventStage[]): void {
    const isCurrentlyAllSelected = this.isAllSelected(filteredEntities);
    const isCurrentlyIndeterminate = this.isIndeterminate(filteredEntities);

    const selectableEntities = getSelectableEntities(filteredEntities);
    const currentSelection = state.selectedStageIds();
    const newSelected = new Set(currentSelection);

    if (isCurrentlyAllSelected || isCurrentlyIndeterminate) {
      selectableEntities.forEach((entity) => newSelected.delete(entity.stage));
    } else {
      selectableEntities.forEach((entity) => newSelected.add(entity.stage));
    }

    state.selectedStageIds.set(newSelected);
  }

  isAllSelected(filteredEntities: readonly EventStage[]): boolean {
    const selectableEntities = getSelectableEntities(filteredEntities);
    const numSelectable = selectableEntities.length;
    const numTotal = filteredEntities.length;

    if (numSelectable === 0) {
      return false;
    }

    const currentSelection = state.selectedStageIds();
    const selectableStageIds = new Set(
      selectableEntities.map((entity) => entity.stage)
    );
    const selectedCount = [...currentSelection].filter((stageId) =>
      selectableStageIds.has(stageId)
    ).length;

    return selectedCount === numSelectable && selectedCount === numTotal;
  }

  isIndeterminate(filteredEntities: readonly EventStage[]): boolean {
    const selectableEntities = getSelectableEntities(filteredEntities);
    const numSelectable = selectableEntities.length;
    const numTotal = filteredEntities.length;

    const currentSelection = state.selectedStageIds();
    const selectableStageIds = new Set(
      selectableEntities.map((entity) => entity.stage)
    );
    const selectedCount = [...currentSelection].filter((stageId) =>
      selectableStageIds.has(stageId)
    ).length;

    if (selectedCount > 0 && selectedCount < numSelectable) {
      return true;
    }

    if (
      numSelectable > 0 &&
      selectedCount === numSelectable &&
      numSelectable < numTotal
    ) {
      return true;
    }

    return false;
  }

  clearAllSelectionsOfDisabledRows(
    filteredEntities: readonly EventStage[]
  ): void {
    const currentSelection = state.selectedStageIds();

    if (currentSelection.size === 0) {
      return;
    }

    const newSelected = new Set(currentSelection);
    let hasChanges = false;

    for (const entity of filteredEntities) {
      if (currentSelection.has(entity.stage)) {
        if (!entity.isOnline || !entity.currentSessionId) {
          newSelected.delete(entity.stage);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      state.selectedStageIds.set(newSelected);
    }
  }

  clearSelection(): void {
    state.selectedStageIds.set(new Set<string>());
  }
}

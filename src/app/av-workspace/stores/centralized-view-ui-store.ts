import { computed, Injectable, signal } from '@angular/core';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { getSelectableEntities } from 'src/app/av-workspace/utils/get-selectable-entities';

interface CentralizedViewUIState {
  searchTerm: string;
  locationFilters: string[];
  selectedItems: Set<EventStage>;
}

const initialState: CentralizedViewUIState = {
  searchTerm: '',
  locationFilters: [],
  selectedItems: new Set<EventStage>(),
};

const state = {
  searchTerm: signal<string>(initialState.searchTerm),
  locationFilters: signal<string[]>(initialState.locationFilters),
  selectedItems: signal<Set<EventStage>>(initialState.selectedItems),
};

@Injectable({
  providedIn: 'root',
})
export class CentralizedViewUIStore {
  public readonly $searchTerm = state.searchTerm.asReadonly();
  public readonly $locationFilters = state.locationFilters.asReadonly();
  public readonly $selectedItems = state.selectedItems.asReadonly();

  public readonly $hasSelection = computed(
    () => state.selectedItems().size > 0
  );
  public readonly $selectionCount = computed(() => state.selectedItems().size);

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
    const currentSelection = state.selectedItems();
    const newSelected = new Set(currentSelection);

    if (newSelected.has(row)) {
      newSelected.delete(row);
    } else {
      newSelected.add(row);
    }

    state.selectedItems.set(newSelected);
  }

  toggleAllRows(filteredEntities: EventStage[]): void {
    const isCurrentlyAllSelected = this.isAllSelected(filteredEntities);
    const isCurrentlyIndeterminate = this.isIndeterminate(filteredEntities);

    const selectableEntities = getSelectableEntities(filteredEntities);
    const currentSelection = state.selectedItems();
    const newSelected = new Set(currentSelection);

    if (isCurrentlyAllSelected || isCurrentlyIndeterminate) {
      selectableEntities.forEach((entity) => newSelected.delete(entity));
    } else {
      selectableEntities.forEach((entity) => newSelected.add(entity));
    }

    state.selectedItems.set(newSelected);
  }

  isAllSelected(filteredEntities: EventStage[]): boolean {
    const selectableEntities = getSelectableEntities(filteredEntities);
    const numSelectable = selectableEntities.length;
    const numTotal = filteredEntities.length;

    if (numSelectable === 0) {
      return false;
    }

    const currentSelection = state.selectedItems();
    const selectedCount = [...currentSelection].filter((entity) =>
      selectableEntities.includes(entity)
    ).length;

    return selectedCount === numSelectable && selectedCount === numTotal;
  }

  isIndeterminate(filteredEntities: EventStage[]): boolean {
    const selectableEntities = getSelectableEntities(filteredEntities);
    const numSelectable = selectableEntities.length;
    const numTotal = filteredEntities.length;

    const currentSelection = state.selectedItems();
    const selectedCount = [...currentSelection].filter((entity) =>
      selectableEntities.includes(entity)
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

  clearSelection(): void {
    state.selectedItems.set(new Set<EventStage>());
  }
}

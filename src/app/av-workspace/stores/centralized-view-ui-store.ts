import { computed, Injectable, signal } from '@angular/core';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';

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
    const currentSelection = state.selectedItems();
    const isAllSelected =
      filteredEntities.length > 0 &&
      filteredEntities.every((entity) => currentSelection.has(entity));

    if (isAllSelected) {
      const newSelected = new Set<EventStage>(
        [...currentSelection].filter(
          (entity) => !filteredEntities.includes(entity)
        )
      );
      state.selectedItems.set(newSelected);
    } else {
      const newSelected = new Set<EventStage>([
        ...currentSelection,
        ...filteredEntities,
      ]);
      state.selectedItems.set(newSelected);
    }
  }

  isAllSelected(filteredEntities: EventStage[]): boolean {
    if (filteredEntities.length === 0) return false;
    const currentSelection = state.selectedItems();
    return filteredEntities.every((entity) => currentSelection.has(entity));
  }

  isIndeterminate(filteredEntities: EventStage[]): boolean {
    if (filteredEntities.length === 0) return false;
    const currentSelection = state.selectedItems();
    const selectedCount = filteredEntities.filter((entity) =>
      currentSelection.has(entity)
    ).length;
    return selectedCount > 0 && selectedCount < filteredEntities.length;
  }

  clearSelection(): void {
    state.selectedItems.set(new Set<EventStage>());
  }
}

import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { SynMultiSelectComponent } from '@syn/components';
import { DropdownOption } from '@syn/models';
import { DashboardFiltersStateService } from '@syn/services';

@Component({
  selector: 'app-projection-image',
  standalone: true,
  imports: [SynMultiSelectComponent, NgOptimizedImage],
  templateUrl: './projection-image.component.html',
  styleUrl: './projection-image.component.scss',
})
export class ProjectionImageComponent {
  public label = input.required<string>();
  public type = input<'session' | 'project'>();
  public filterType = input.required<'days' | 'tracks' | 'none'>();
  public imgUrl = input<string>();

  protected eventDays = computed(() => this._filtersStateService.eventDays());
  protected liveEvent = computed(() => this._filtersStateService.liveEvent());
  protected eventTracks = computed(() =>
    this._filtersStateService.eventTracks()
  );

  private _filtersStateService = inject(DashboardFiltersStateService);

  private _selectedDays: DropdownOption[] = [];
  private _selectedTracks: DropdownOption[] = [];

  protected onEventDaysSelect = (selectedOptions: DropdownOption[]): void => {
    this._selectedDays = [...this.eventDays()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedDaysSet = new Set(selectedLabels);
    this._selectedDays.forEach((aOption) => {
      if (selectedDaysSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
  };

  protected onEventTracksSelect = (selectedOptions: DropdownOption[]): void => {
    this._selectedTracks = [...this.eventTracks()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedTracksSet = new Set(selectedLabels);
    this._selectedTracks.forEach((aOption) => {
      if (selectedTracksSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
  };

  protected onProjectToScreenClick = (): void => {
    // todo
  };
}

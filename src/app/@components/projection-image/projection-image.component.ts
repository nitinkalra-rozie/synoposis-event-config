import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  SynMultiSelectComponent,
  SynSingleSelectComponent,
} from '@syn/components';
import { ProjectionData } from '@syn/data-services';
import { DropdownOption } from '@syn/models';
import { DashboardFiltersStateService } from '@syn/services';
import { replaceDashAndSpacesWithUnderscore } from '@syn/utils';

@Component({
  selector: 'app-projection-image',
  standalone: true,
  imports: [
    SynMultiSelectComponent,
    NgOptimizedImage,
    SynSingleSelectComponent,
  ],
  templateUrl: './projection-image.component.html',
  styleUrl: './projection-image.component.scss',
})
export class ProjectionImageComponent {
  constructor() {
    effect(() => {
      if (
        this.eventDays()?.length &&
        this.filterType() === 'one-day' &&
        this.selectedDays?.length === 0
      ) {
        this.selectedDays.push(this.eventDays()[0]);
      }
    });
  }

  public label = input.required<string>();
  public key = input<string>();
  public filterType = input.required<'days' | 'tracks' | 'one-day' | 'none'>();
  public imgUrl = input<string>();

  public projectedToScreen = output<ProjectionData>();

  protected eventDays = computed(() => this._filtersStateService.eventDays());
  protected liveEvent = computed(() => this._filtersStateService.liveEvent());
  protected eventTracks = computed(() =>
    this._filtersStateService.completedTracks()
  );

  protected selectedDays: DropdownOption[] = [];
  protected selectedTracks: DropdownOption[] = [];

  private _filtersStateService = inject(DashboardFiltersStateService);

  protected onEventDaysSelect = (selectedOptions: DropdownOption[]): void => {
    this.selectedDays = [...this.eventDays()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedDaysSet = new Set(selectedLabels);
    this.selectedDays.forEach((aOption) => {
      if (selectedDaysSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
  };

  protected onSingleEventDaySelect = (
    selectedOptions: DropdownOption
  ): void => {
    this.selectedDays = [
      {
        ...selectedOptions,
        isSelected: true,
      },
    ];
  };

  protected onEventTracksSelect = (selectedOptions: DropdownOption[]): void => {
    this.selectedTracks = [...this.eventTracks()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedTracksSet = new Set(selectedLabels);
    this.selectedTracks.forEach((aOption) => {
      if (selectedTracksSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
  };

  protected onProjectToScreenClick = (): void => {
    this.projectedToScreen.emit({
      identifier: replaceDashAndSpacesWithUnderscore(this.label()),
      selectedDays: this.selectedDays
        .filter((aDay) => aDay.isSelected)
        .map((day) => day.label),
      selectedTracks: this.selectedTracks
        .filter((aDay) => aDay.isSelected)
        .map((track) => track.label),
    });
  };
}

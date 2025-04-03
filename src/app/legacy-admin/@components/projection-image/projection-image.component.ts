import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { SynMultiSelectComponent } from 'src/app/legacy-admin/@components/syn-multi-select/syn-multi-select.component';
import { SynSingleSelectComponent } from 'src/app/legacy-admin/@components/syn-single-select';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { BrowserWindowService } from 'src/app/legacy-admin/@services/browser-window.service';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { ProjectionStateService } from 'src/app/legacy-admin/@services/projection-state.service';
import { replaceDashAndSpacesWithUnderscore } from 'src/app/legacy-admin/@utils/string-utils';
import { SynSpinnerComponent } from '../syn-spinner/syn-spinner.component';
import { ProjectionData } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';

@Component({
  selector: 'app-projection-image',
  standalone: true,
  imports: [
    SynMultiSelectComponent,
    SynSingleSelectComponent,
    SynSpinnerComponent,
    NgClass,
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
      } else if (
        this.eventTracks()?.length &&
        this.filterType() === 'tracks' &&
        this.selectedTracks?.length === 0
      ) {
        this.selectedTracks = this.eventTracks();
      } else if (
        this.eventDays()?.length &&
        this.filterType() === 'days' &&
        this.selectedDays?.length === 0
      ) {
        this.selectedDays = this.eventDays();
      }
    });
  }

  public label = input.required<string>();
  public key = input<string>();
  public filterType = input.required<'days' | 'tracks' | 'one-day' | 'none'>();
  public imgUrl = input<string>();

  public projectedToScreen = output<ProjectionData>();

  protected eventDays = computed(() => this._filtersStateService.eventDays());
  protected isProjecting = computed(
    () => this._projectionStateService.isProjecting()[this._identifier()]
  );
  protected liveEvent = computed(() => this._filtersStateService.liveEvent());
  protected eventTracks = computed(() =>
    this._filtersStateService.completedTracks()
  );

  protected selectedDays: DropdownOption[] = [];
  protected selectedTracks: DropdownOption[] = [];

  private _identifier = computed(() =>
    replaceDashAndSpacesWithUnderscore(this.label())
  );

  private _windowService = inject(BrowserWindowService);
  private _filtersStateService = inject(DashboardFiltersStateService);
  private _projectionStateService = inject(ProjectionStateService);

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
    const payload = {
      identifier: this._identifier(),
      selectedDays: this.selectedDays
        .filter((aDay) => aDay.isSelected)
        .map((day) => day.label),
      selectedTracks: this.selectedTracks
        .filter((aDay) => aDay.isSelected)
        .map((track) => track.label),
    };
    this.projectedToScreen.emit(payload);
    setTimeout(() => {
      this._projectionStateService.toggleProjectingState(payload.identifier);
    });
    this._windowService.showInsightsProjectedWindow();
  };
}

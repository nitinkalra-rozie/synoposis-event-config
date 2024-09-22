import { Component, computed, inject } from '@angular/core';
import { SynMultiSelectComponent } from '@syn/components';
import { DropdownOption } from '@syn/models';
import { DashboardFiltersStateService } from '@syn/services';

@Component({
  selector: 'app-projection-image',
  standalone: true,
  imports: [SynMultiSelectComponent],
  templateUrl: './projection-image.component.html',
  styleUrl: './projection-image.component.scss',
})
export class ProjectionImageComponent {
  protected eventDays = computed(() => this._filtersStateService.eventDays());

  private _filtersStateService = inject(DashboardFiltersStateService);

  protected onEventDaysSelect = (selectedOptions: DropdownOption[]): void => {
    // const daysCopy = [...this.eventDays()];
    // const selectedLabels: string[] = [];
    // for (const aOption of selectedOptions) {
    //   if (aOption.isSelected) {
    //     selectedLabels.push(aOption.label);
    //   }
    // }
    // const selectedDaysSet = new Set(selectedLabels);
    // daysCopy.forEach((aOption) => {
    //   if (selectedDaysSet.has(aOption.label)) {
    //     aOption.isSelected = true;
    //   } else {
    //     aOption.isSelected = false;
    //   }
    // });
    // this.filtersStateService.setEventDays(daysCopy);
  };
}

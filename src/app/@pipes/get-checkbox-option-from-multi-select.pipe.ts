import { Pipe, PipeTransform } from '@angular/core';
import { MultiSelectOption } from 'src/app/models/multi-select';
import { CheckboxOption } from '../models/elsa-checkbox';

@Pipe({
  name: 'getCheckboxOptionFromMultiSelect',
  standalone: true,
})
export class GetCheckboxOptionFromMultiSelectPipe implements PipeTransform {
  transform(options: MultiSelectOption[]): CheckboxOption<MultiSelectOption>[] {
    if (!options) {
      return [];
    }

    return options.map((aOption) => ({
      label: aOption.label,
      value: aOption,
      isChecked: aOption.isSelected,
    }));
  }
}

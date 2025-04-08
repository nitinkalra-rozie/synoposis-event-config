import { Pipe, PipeTransform } from '@angular/core';
import { CheckboxOption } from 'src/app/legacy-admin/@models/checkbox';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';

@Pipe({
  name: 'getCheckboxOptionFromMultiSelect',
  standalone: true,
})
export class GetCheckboxOptionFromMultiSelectPipe implements PipeTransform {
  transform(options: DropdownOption[]): CheckboxOption<DropdownOption>[] {
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

import { Pipe, PipeTransform } from '@angular/core';
import { CheckboxOption, DropdownOption } from '@syn/models';

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

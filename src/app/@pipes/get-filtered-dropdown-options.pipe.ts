import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@syn/models';

@Pipe({
  name: 'getFilteredDropdownOptions',
  standalone: true,
})
export class GetFilteredDropdownOptionsPipe implements PipeTransform {
  transform(options: DropdownOption[], searchText: string): DropdownOption[] {
    if (!options) {
      return [];
    }
    if (!searchText) {
      return options;
    }

    return options.filter((aOption) =>
      aOption.label.toLowerCase().includes(searchText.toLowerCase().trim())
    );
  }
}

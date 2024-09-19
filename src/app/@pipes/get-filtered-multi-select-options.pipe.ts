import { Pipe, PipeTransform } from '@angular/core';
import { MultiSelectOption } from '@syn/models';

@Pipe({
  name: 'getFilteredMultiSelectOptions',
  standalone: true,
})
export class GetFilteredMultiSelectOptionsPipe implements PipeTransform {
  transform(
    options: MultiSelectOption[],
    searchText: string
  ): MultiSelectOption[] {
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

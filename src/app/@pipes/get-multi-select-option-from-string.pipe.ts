import { Pipe, PipeTransform } from '@angular/core';
import { MultiSelectOption } from 'src/app/models/multi-select';

@Pipe({
  name: 'getMultiSelectOptionFromString',
  standalone: true,
})
export class GetMultiSelectOptionFromStringPipe implements PipeTransform {
  transform(options: string[]): MultiSelectOption[] {
    if (!options) {
      return [];
    }

    return options.map((aOption) => ({
      key: aOption,
      label: aOption,
    }));
  }
}

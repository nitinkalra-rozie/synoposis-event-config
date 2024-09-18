import { Pipe, PipeTransform } from '@angular/core';
import { MultiSelectOption } from '@syn/models';

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

import { Pipe, PipeTransform } from '@angular/core';
import { MultiSelectOption } from 'src/app/models/multi-select';

@Pipe({
  name: 'getSelectedOptions',
  standalone: true,
})
export class GetSelectedOptionsPipe implements PipeTransform {
  transform(options: MultiSelectOption[]): MultiSelectOption[] {
    return options.filter((aOption) => !!aOption.isSelected);
  }
}

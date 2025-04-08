import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { getDropdownOptionsFromString } from 'src/app/legacy-admin/@utils/data-utils';

@Pipe({
  name: 'getMultiSelectOptionFromString',
  standalone: true,
})
export class GetMultiSelectOptionFromStringPipe implements PipeTransform {
  transform(
    options: string[],
    defaultSelection = false,
    prevOptions?: DropdownOption[]
  ): DropdownOption[] {
    return getDropdownOptionsFromString(options, defaultSelection, prevOptions);
  }
}

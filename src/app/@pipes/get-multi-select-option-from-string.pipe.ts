import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@syn/models';
import { getDropdownOptionsFromString } from '@syn/utils';

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

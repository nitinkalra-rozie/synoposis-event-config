import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@syn/models';

@Pipe({
  name: 'getSelectedOptions',
  standalone: true,
})
export class GetSelectedOptionsPipe implements PipeTransform {
  transform(options: DropdownOption[]): DropdownOption[] {
    return options.filter((aOption) => !!aOption.isSelected);
  }
}

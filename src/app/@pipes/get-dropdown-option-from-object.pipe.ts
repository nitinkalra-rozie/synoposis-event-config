import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@syn/models';

@Pipe({
  name: 'getDropdownOptionFromObject',
  standalone: true,
})
export class GetDropdownOptionFromObjectPipe implements PipeTransform {
  transform<T>(
    list: T[],
    labelIdentifier: string,
    valueIdentifier: string,
    defaultSelection = false,
    indicatorStatusIdentifier?: string,
    indicatorActiveState?: string
  ): DropdownOption[] {
    if (!list) {
      return [];
    }

    return list.map((aOption) => ({
      key: aOption[valueIdentifier],
      label: aOption[labelIdentifier],
      value: aOption[valueIdentifier],
      isSelected: defaultSelection,
      metadata: {
        originalContent: aOption,
        isIndicatorActive:
          aOption[indicatorStatusIdentifier] === indicatorActiveState,
      },
    }));
  }
}

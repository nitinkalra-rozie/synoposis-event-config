import { Pipe, PipeTransform } from '@angular/core';
import { getAbsoluteDate } from 'src/app/shared/utils/date-util';

@Pipe({
  name: 'absoluteDate',
  standalone: true,
})
export class AbsoluteDatePipe implements PipeTransform {
  transform(
    date: Date | number | string | undefined | null,
    format: string = 'MMM d, y'
  ): string {
    if (!date) return '';
    return getAbsoluteDate(date, format);
  }
}

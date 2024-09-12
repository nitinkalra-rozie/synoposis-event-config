import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncate',
    standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(
    value = '',
    addPlus = false,
    limit = 45,
    completeWords = false,
    ellipsis = '...'
  ): string {
    if (value.length <= limit) {
      return value;
    }

    if (completeWords) {
      limit = value.slice(0, limit).lastIndexOf(' ');
    }

    if (addPlus) {
      return `${value.slice(0, limit)}${ellipsis} +`;
    }

    return `${value.slice(0, limit)}${ellipsis}`;
  }
}

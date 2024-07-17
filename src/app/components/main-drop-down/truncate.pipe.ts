import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string = '',
    addPlus: boolean = false,
    limit: number = 50,
    completeWords: boolean = false,
    ellipsis: string = '...'
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

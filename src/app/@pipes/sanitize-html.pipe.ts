import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizeHtml',
  standalone: true,
})
export class SanitizeHtmlPipe implements PipeTransform {
  private _sanitizer = inject(DomSanitizer);

  transform(value: any): SafeHtml {
    return this._sanitizer.bypassSecurityTrustHtml(value);
  }
}

import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class IconsService {
  constructor(
    private readonly _iconRegistry: MatIconRegistry,
    private readonly _sanitizer: DomSanitizer
  ) {
    this.initIcons();
  }

  private initIcons(): void {
    this._registerIconSet('syn', 'syn-icons.svg');
  }

  private _registerIconSet(namespace: string, fileName: string): void {
    this._iconRegistry.addSvgIconSetInNamespace(
      namespace,
      this._sanitizer.bypassSecurityTrustResourceUrl(
        `/assets/mat-icons/${fileName}`
      )
    );
  }
}

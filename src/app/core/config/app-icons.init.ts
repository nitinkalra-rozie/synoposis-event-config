import { inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

export function appIconsInitializer() {
  return (): void => _registerIconSet('syn', 'syn-icons.svg');
}

const _registerIconSet = (namespace: string, fileName: string): void => {
  const _iconRegistry = inject(MatIconRegistry);
  const _sanitizer = inject(DomSanitizer);

  _iconRegistry.addSvgIconSetInNamespace(
    namespace,
    _sanitizer.bypassSecurityTrustResourceUrl(`/assets/icons/${fileName}`)
  );
};

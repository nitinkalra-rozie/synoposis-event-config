import { Injectable } from '@angular/core';
import { getInsightsDomainUrl } from '@syn/utils';

@Injectable({
  providedIn: 'root',
})
export class BrowserWindowService {
  public newWindow: Window;

  openInsightsSessionWindow(sessionId: string): void {
    const windowFeatures = `
    toolbar=0,
    location=0,
    status=1,
    menubar=0,
    scrollbars=1,
    resizable=1,
    width=${screen.width},
    height=${screen.height},
    top=0,
    left=0
  `.replace(/\s+/g, '');
    const url = `${getInsightsDomainUrl()}/session/${sessionId}`;

    this.newWindow = window.open(url, '_blank', windowFeatures);
    this.newWindow.moveTo(0, 0);
    this.newWindow.resizeTo(screen.width, screen.height);
  }

  showInsightsWelcomeWindow(): void {
    this.newWindow.location.replace(getInsightsDomainUrl());
  }
}

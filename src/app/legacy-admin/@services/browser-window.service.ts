import { Injectable } from '@angular/core';
import { getInsightsDomainUrl } from 'src/app/legacy-admin/@utils/get-domain-urls-util';

interface WindowFeatures {
  toolbar?: number;
  location?: number;
  status?: number;
  menubar?: number;
  scrollbars?: number;
  resizable?: number;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BrowserWindowService {
  private _window: Window | null = null;
  private _projectionWindows: Set<Window> = new Set();
  private _windowCloseCallback: (() => void) | null = null;
  private _windowCloseInterval: number | null = null;

  openInsightsSessionWindow(url: string): void {
    if (!this._isWindowValid()) {
      this._openWindow(url);
    } else {
      this._updateWindowUrl(url);
    }
  }

  showInsightsProjectedWindow(selectedLocation: string): void {
    const projectedUrl = `${getInsightsDomainUrl()}/primary-screen?stage=${selectedLocation}`;

    if (!this._isWindowValid()) {
      this._openWindow(projectedUrl);
    } else {
      this._updateWindowUrl(projectedUrl);
    }
  }

  closeAllProjectionWindows(): void {
    if (this._window && !this._window.closed) {
      this._window.close();
      this._window = null;
    }

    this._projectionWindows.forEach((window) => {
      if (!window.closed) {
        window.close();
      }
    });

    this._projectionWindows.clear();
  }

  setWindowCloseCallback(callback: () => void): void {
    this._windowCloseCallback = callback;
    this._startWindowCloseMonitoring();
  }

  clearWindowCloseCallback(): void {
    this._windowCloseCallback = null;
    this._stopWindowCloseMonitoring();
  }

  private _startWindowCloseMonitoring(): void {
    if (this._windowCloseInterval) {
      clearInterval(this._windowCloseInterval);
    }

    this._windowCloseInterval = window.setInterval(() => {
      if (this._window && this._window.closed && this._windowCloseCallback) {
        this._windowCloseCallback();
        this._stopWindowCloseMonitoring();
      }
    }, 1000);
  }

  private _stopWindowCloseMonitoring(): void {
    if (this._windowCloseInterval) {
      clearInterval(this._windowCloseInterval);
      this._windowCloseInterval = null;
    }
  }

  private _getWindowFeatures(features: WindowFeatures = {}): string {
    const defaultFeatures: WindowFeatures = {
      toolbar: 0,
      location: 0,
      status: 1,
      menubar: 0,
      scrollbars: 1,
      resizable: 1,
      width: screen.width,
      height: screen.height,
      top: 0,
      left: 0,
    };

    const mergedFeatures = { ...defaultFeatures, ...features };

    return Object.entries(mergedFeatures)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }

  private _openWindow(
    url: string,
    features: WindowFeatures = {}
  ): Window | null {
    const windowFeatures = this._getWindowFeatures(features);
    const newWindow = window.open(url, '_blank', windowFeatures);

    if (newWindow) {
      newWindow.moveTo(0, 0);
      newWindow.resizeTo(screen.width, screen.height);
      this._window = newWindow;
      this._projectionWindows.add(newWindow);
    }

    return newWindow;
  }

  private _updateWindowUrl(url: string): void {
    if (this._window && !this._window.closed) {
      this._window.location.replace(url);
    }
  }

  private _isWindowValid(): boolean {
    return Boolean(this._window && !this._window.closed);
  }
}

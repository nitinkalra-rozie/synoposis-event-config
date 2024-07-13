import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  private wakeLock: any = null;
  constructor() { }

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
        });
        console.log('Screen Wake Lock acquired');
      } else {
        console.log('Screen Wake Lock API not supported in this browser.');
      }
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  async releaseWakeLock() {
    if (this.wakeLock !== null) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}

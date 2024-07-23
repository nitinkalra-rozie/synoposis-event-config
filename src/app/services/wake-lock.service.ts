import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;

  // async requestWakeLock(): Promise<void> {
  //   try {
  //     this.wakeLock = await navigator.wakeLock.request('screen');
  //     console.log('Wake Lock is active');
  //   } catch (err) {
  //     console.error(`${err.name}, ${err.message}`);
  //   }
  // }

  // async releaseWakeLock(): Promise<void> {
  //   if (this.wakeLock) {
  //     await this.wakeLock.release();
  //     this.wakeLock = null;
  //     console.log('Wake Lock released');
  //   }
  // }
}
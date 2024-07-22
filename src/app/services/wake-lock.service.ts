// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class WakeLockService {
//   private wakeLock: any = null; // Explicitly type the wakeLock property

//   constructor() {}

//   async requestWakeLock() {
//     try {
//       this.wakeLock = await (navigator as any).wakeLock.request('screen');
//     } catch (error) { // Remove type annotation here
//       console.error(`Wake Lock request failed: ${error.name}, ${error.message}`);
//     }
//   }

//   releaseWakeLock() {
//     if (this.wakeLock !== null) {
//       this.wakeLock.release()
//         .then(() => {
//           this.wakeLock = null;
//         });
//     }
//   }
// }
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WakeLockService {
  private wakeLock: any = null;
  private isIos: boolean = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  private videoElement: HTMLVideoElement | null = null;

  constructor() { 
    if (this.isIos) {
      this.setupVideoElement();
    }
  }

  private setupVideoElement() {
    this.videoElement = document.getElementById('hiddenVideo') as HTMLVideoElement;
  }

  async requestWakeLock() {
    if (this.isIos) {
      this.requestWakeLockForIos();
    } else {
      await this.requestWakeLockForSupportedBrowsers();
    }
  }

  private async requestWakeLockForSupportedBrowsers() {
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

  private requestWakeLockForIos() {
    if (this.videoElement) {
      this.videoElement.play()
        .then(() => {
          console.log('iOS screen wake lock acquired using video.');
        })
        .catch((err) => {
          console.error(`Error playing video: ${err.message}`);
        });
    }
  }

  async releaseWakeLock() {
    if (this.isIos) {
      this.releaseWakeLockForIos();
    } else {
      await this.releaseWakeLockForSupportedBrowsers();
    }
  }

  private async releaseWakeLockForSupportedBrowsers() {
    if (this.wakeLock !== null) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Screen Wake Lock released');
    }
  }

  private releaseWakeLockForIos() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
      console.log('iOS screen wake lock released.');
    }
  }
}

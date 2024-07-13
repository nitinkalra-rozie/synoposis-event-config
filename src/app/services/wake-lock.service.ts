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

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  // enableProdMode();
}
if (environment.production) {
  if (window) {
      window.console.debug = window.console.error = () => { };
  }
  console.debug = console.error = () => { };
}
tryKeepScreenAlive(1000000);
function tryKeepScreenAlive(minutes) {
  navigator.wakeLock.request("screen").then(lock => {
    setTimeout(() => lock.release(), minutes * 60 * 1000);
  });
}

tryKeepScreenAlive(10);
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

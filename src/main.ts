import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import NoSleep from '@uriopass/nosleep.js';
var noSleep = new NoSleep();
if (environment.production) {
  // enableProdMode();
}
if (environment.production) {
  if (window) {
      window.console.debug = window.console.error = () => { };
  }
  console.debug = console.error = () => { };
}
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

var wakeLockEnabled = false;
var toggleEl = document.querySelector("#index-body");
toggleEl.addEventListener('click', function() {
  if (!wakeLockEnabled) {
    noSleep.enable();
    wakeLockEnabled = true;
  } else {
  }
}, false);
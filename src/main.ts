import { bootstrapApplication } from '@angular/platform-browser';
import NoSleep from '@uriopass/nosleep.js';
import { appConfig } from 'src/app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const noSleep = new NoSleep();

if (environment.production) {
  if (window) {
    window.console.debug = window.console.error = () => {};
  }
  console.debug = console.error = () => {};
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.log(err));

// TODO:@later remove the following and use navigator.wakeLock.request('screen'); at the required places
// TODO:@later and get rid of the dependency @uriopass/nosleep.js
// Keep existing wake lock logic unchanged
let wakeLockEnabled = false;
const toggleEl = document.querySelector('#index-body');
toggleEl?.addEventListener(
  'click',
  function () {
    if (!wakeLockEnabled) {
      noSleep.enable();
      wakeLockEnabled = true;
    }
  },
  false
);

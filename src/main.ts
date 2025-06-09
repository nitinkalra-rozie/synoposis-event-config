import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import NoSleep from '@uriopass/nosleep.js';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { appConfig } from 'src/app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

const noSleep = new NoSleep();
Chart.register(ChartDataLabels);

if (environment.production) {
  if (window) {
    window.console.debug = window.console.error = () => {};
  }
  console.debug = console.error = () => {};
  enableProdMode();
}

bootstrapApplication(App, appConfig).catch((err) => console.log(err));

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

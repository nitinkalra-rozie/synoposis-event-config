import { CommonModule, IMAGE_CONFIG } from '@angular/common';
import {
  APP_INITIALIZER,
  importProvidersFrom,
  enableProdMode,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DashboardFiltersStateService, IconsService } from '@syn/services';
import NoSleep from '@uriopass/nosleep.js';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthApiService } from './app/services/auth-api.service';
import { environment } from './environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/@interceptors/auth.interceptor';
import { AuthService } from './app/services/auth.service';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Chart from 'chart.js/auto';

// Register the data labels plugin
Chart.register(ChartDataLabels);

const noSleep = new NoSleep();

if (environment.production) {
  if (window) {
    window.console.debug = window.console.error = () => {};
  }
  console.debug = console.error = () => {};
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      AppRoutingModule,
      FormsModule,
      CommonModule,
      BrowserModule,
      ReactiveFormsModule
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    AuthApiService,
    AuthService,
    DashboardFiltersStateService,
    {
      provide: IMAGE_CONFIG,
      useValue: {
        disableImageSizeWarning: true,
        disableImageLazyLoadWarning: true,
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      multi: true,
      deps: [IconsService],
    },
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
  ],
}).catch((err) => console.log(err));

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

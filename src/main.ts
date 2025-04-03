import { CommonModule, IMAGE_CONFIG } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom, provideAppInitializer } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import NoSleep from '@uriopass/nosleep.js';
import { appIconsInitializer } from 'src/app/core/config/app-icons.init';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { AuthApiService } from './app/legacy-admin/services/auth-api.service';
import { AuthService } from './app/legacy-admin/services/auth.service';
import { environment } from './environments/environment';

const noSleep = new NoSleep();

if (environment.production) {
  if (window) {
    window.console.debug = window.console.error = () => {};
  }
  console.debug = console.error = () => {};
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
    provideAppInitializer(() => {
      const initializerFn = appIconsInitializer();
      return initializerFn();
    }),
    provideAnimationsAsync(),
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

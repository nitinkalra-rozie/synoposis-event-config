import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from 'src/app/app.routes';
import { appIconsInitializer } from 'src/app/core/config/app-icons.init';
import { authInterceptor } from 'src/app/core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(BrowserModule),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const initializerFn = appIconsInitializer();
      return initializerFn();
    }),
    provideAnimationsAsync(),
  ],
};

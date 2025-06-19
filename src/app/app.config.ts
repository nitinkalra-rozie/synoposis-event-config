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
import { Amplify } from 'aws-amplify';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from 'src/app/app.routes';
import { authInterceptor } from 'src/app/core/auth/interceptors/auth-interceptor';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { appIconsInitializer } from 'src/app/core/config/app-icons.init';

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
    provideAppInitializer(() => {
      Amplify.configure(amplifyConfig);
    }),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
  ],
};

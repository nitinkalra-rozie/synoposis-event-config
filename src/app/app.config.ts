import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app-routing.module';
import { authInterceptor } from './@interceptors/auth.interceptor';
import { DashboardFiltersStateService } from './@services/dashboard-filters-state.service';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    DashboardFiltersStateService,
    AuthService,
  ],
};

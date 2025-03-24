import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './@interceptors/auth.interceptor';
import { DashboardFiltersStateService } from './@services/dashboard-filters-state.service';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    DashboardFiltersStateService,
    AuthService,
  ],
};

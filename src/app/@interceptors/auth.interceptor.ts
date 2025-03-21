import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardFiltersStateService } from '../@services/dashboard-filters-state.service';
import { AuthService } from '../../app/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private dashboardFiltersState: DashboardFiltersStateService,
    private authService: AuthService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isPrivateEndpoint(request.url)) {
      return next.handle(request);
    }

    if (this.authService.isTokenExpired()) {
      this.dashboardFiltersState.handleUnauthorizedResponse();
      this.authService.logout();
      return throwError(() => new Error('Session expired'));
    }

    const token = this.authService.getAccessToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.dashboardFiltersState.handleUnauthorizedResponse();
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  private isPrivateEndpoint(url: string): boolean {
    const authEndpoints = [
      '/login',
      '/refresh-token',
      '/auth/login',
      '/auth/refresh',
    ];
    return authEndpoints.some((endpoint) => url.includes(endpoint));
  }
}

import {
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../app/services/auth.service';

const isPrivateEndpoint = (url: string): boolean => {
  const authEndpoints = [
    '/login',
    '/refresh-token',
    '/auth/login',
    '/auth/refresh',
  ];
  return authEndpoints.some((endpoint) => url.includes(endpoint));
};

export const authInterceptor = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  if (!isPrivateEndpoint(request.url)) {
    return next(request);
  }

  if (authService.isTokenExpired()) {
    authService.logout();
    return throwError(() => new Error('Session expired'));
  }

  const token = authService.getAccessToken();
  let authRequest = request;

  if (token) {
    authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};

import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HTTP_STATUS_CODE } from 'src/app/core/auth/constants/auth-constants';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { AuthStore } from 'src/app/core/auth/stores/auth-store';
import { environment } from 'src/environments/environment';

const isPrivateAPIEndpoint = (url: string): boolean => {
  const privateAPIEndpoints = [
    '/api/',
    '/admin/',
    '/av-workspace',
    '/user/',
    '/dashboard/',
    'r1/getEventConfig',
    'r1/getEventDetails',
    'r4/config',
    'r2/config',
    'r2/getPreSignedUrl',
    'r2/postTranscript',
    'r2/getCurrentSessionDetails',
    'r3/manage-av',
    'r6/config',
    'r5/postEventDetails',
    'r5/admin-analytics',
    'r2/stage',
    'r2/postAudioChunk',
    '/get-content-versions',
    '/get-version-content',
    '/generate-content-pdf',
    '/publish-pdf-content',
    '/get-content-pdf',
    '/manual-edit-generated-content',
  ];

  const publicAPIEndpoints = [
    '/login',
    '/refresh-token',
    '/auth/login',
    '/auth/refresh',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/public/',
  ];

  if (publicAPIEndpoints.some((endpoint) => url.includes(endpoint))) {
    return false;
  }

  return (
    privateAPIEndpoints.some((endpoint) => url.includes(endpoint)) ||
    url.includes('/api/')
  );
};

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authFacade = inject(AuthFacade);
  const authStore = inject(AuthStore);

  if (!isPrivateAPIEndpoint(req.url)) {
    return next(req);
  }

  return authFacade.getValidToken$().pipe(
    switchMap((accessToken) => {
      const headers: Record<string, string> = {
        'X-Api-Key': environment.X_API_KEY,
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const authorizedRequest = req.clone({ setHeaders: headers });
      return next(authorizedRequest);
    }),
    catchError((error) => {
      if (authStore.$isLoggingOut()) {
        return throwError(() => error);
      }
      if (
        error.status === HTTP_STATUS_CODE.UNAUTHORIZED ||
        error.status === HTTP_STATUS_CODE.FORBIDDEN
      ) {
        return authFacade
          .logout$()
          .pipe(switchMap(() => throwError(() => error)));
      }
      return throwError(() => error);
    })
  );
};

import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth/services/auth-service';
import { environment } from 'src/environments/environment';

const isPrivateAPIEndpoint = (url: string): boolean => {
  const privateAPIEndpoints = [
    '/api/',
    '/admin/',
    '/user/',
    '/dashboard/',
    'r1/getEventConfig',
    'r1/getEventDetails',
    'r4/config',
    'r2/config',
    'r2/getPreSignedUrl',
    'r2/postTranscript',
    'r2/getCurrentSessionDetails',
    'r6/config',
    'r5/postEventDetails',
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
  const authService = inject(AuthService);

  if (!isPrivateAPIEndpoint(req.url)) {
    return next(req);
  }

  return from(authService.getAccessToken$()).pipe(
    switchMap((accessToken) => {
      const headers: Record<string, string> = {
        'X-Api-Key': environment.X_API_KEY,
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const authorizedRequest = req.clone({ setHeaders: headers });
      return next(authorizedRequest);
    })
  );
};

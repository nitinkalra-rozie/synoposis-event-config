import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { environment } from 'src/environments/environment';

const isPrivateEndpoint = (url: string): boolean => {
  const authEndpoints = [
    '/login',
    '/refresh-token',
    '/auth/login',
    '/auth/refresh',
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
  const authHeaders: Record<string, string> = {
    'X-Api-Key': environment.X_API_KEY,
  };

  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }
  const authRequest = request.clone({ setHeaders: authHeaders });

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};

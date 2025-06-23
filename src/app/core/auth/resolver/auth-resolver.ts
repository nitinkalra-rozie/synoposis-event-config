import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import {
  getDefaultRedirectUrl,
  isUserAuthenticated,
} from 'src/app/core/auth/utils/auth-utils';
import { AuthService } from '../services/auth-service';

export const authRedirectResolver: ResolveFn<null> = (): Observable<null> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    switchMap((isAuth) => {
      if (!isAuth) {
        return of(null);
      }

      return authService.getUserRole$().pipe(
        take(1),
        tap((role) => {
          if (isUserAuthenticated(role)) {
            const redirectUrl = getDefaultRedirectUrl(role);
            router.navigateByUrl(redirectUrl);
          }
        })
      );
    }),
    switchMap(() => of(null))
  );
};

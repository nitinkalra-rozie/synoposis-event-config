import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';
import {
  getDefaultRedirectUrl,
  isUserAuthenticated,
} from '../utils/auth-utils';

export const loginRedirectGuard: CanActivateFn = (
  _route,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$().pipe(
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

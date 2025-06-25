import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth/services/auth-service';
import {
  getDefaultRedirectUrl,
  isUserAuthenticated,
} from 'src/app/core/auth/utils/auth-utils';

export const loginRedirectGuard: CanActivateFn = (
  _route,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    switchMap((isAuth) => {
      if (!isAuth) {
        return of(true);
      }

      return authService.getUserRole$().pipe(
        take(1),
        map((role) => {
          if (isUserAuthenticated(role)) {
            const redirectUrl = getDefaultRedirectUrl(role);
            return router.createUrlTree([redirectUrl]);
          }
          return true;
        })
      );
    })
  );
};

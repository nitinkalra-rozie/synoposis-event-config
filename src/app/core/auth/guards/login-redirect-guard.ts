import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import {
  getDefaultRedirectUrl,
  isUserAuthenticated,
} from 'src/app/core/auth/utils/auth-utils';

export const loginRedirectGuard: CanActivateFn = (
  _route,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authFacade = inject(AuthFacade);

  const isCachedAuth = authFacade.isAuthenticated();
  if (!isCachedAuth) {
    return of(router.createUrlTree(['/login']));
  }

  return authFacade.isAuthenticated().pipe(
    take(1),
    switchMap((isAuth) => {
      if (!isAuth) {
        return of(true);
      }

      return authFacade.getUserRole$().pipe(
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

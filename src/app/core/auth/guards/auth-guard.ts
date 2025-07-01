import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
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
  hasRoutePermission,
  isUserAuthenticated,
} from 'src/app/core/auth/utils/auth-utils';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authFacade = inject(AuthFacade);

  return authFacade.checkSession$().pipe(
    take(1),
    switchMap((session) => {
      if (!session.isAuthenticated) {
        return of(router.createUrlTree(['/login']));
      }

      return authFacade.getUserRole$().pipe(
        take(1),
        map((userRole: UserRole | null) => {
          if (!userRole) {
            return router.createUrlTree(['/unauthorized']);
          }

          if (!isUserAuthenticated(userRole)) {
            return router.createUrlTree(['/login']);
          }

          const currentPath = state.url;
          const hasPermission = hasRoutePermission(userRole, currentPath);

          return hasPermission
            ? true
            : router.createUrlTree([getDefaultRedirectUrl(userRole)]);
        })
      );
    })
  );
};

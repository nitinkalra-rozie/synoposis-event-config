import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth/services/auth-service';
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
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkSession$().pipe(
    take(1),
    switchMap((isValid) => {
      if (!isValid) {
        return of(router.createUrlTree(['/login']));
      }

      return authService.getUserRole$().pipe(
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
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

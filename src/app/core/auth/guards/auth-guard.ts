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
import { AuthService } from 'src/app/core/auth/services/auth-service';
import {
  getDefaultRedirectUrl,
  hasRoutePermission,
  isUserAuthenticated,
} from 'src/app/core/auth/utils/auth-utils';
import { UserRole } from '../../enum/auth-roles.enum';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.refreshSession$().pipe(
    take(1),
    switchMap((session) => {
      const hasValidSession = !!session?.tokens?.accessToken;

      if (!hasValidSession) {
        return of(router.createUrlTree(['/login']));
      }

      const accessToken = session.tokens?.accessToken?.toString();
      if (!accessToken || accessToken.trim() === '') {
        return of(router.createUrlTree(['/login']));
      }

      return authService.getUserRole$().pipe(
        take(1),
        map((userRole: UserRole) => {
          const currentPath = state.url;

          if (!isUserAuthenticated(userRole)) {
            return router.createUrlTree(['/login']);
          }

          const hasPermission = hasRoutePermission(userRole, currentPath);

          if (hasPermission) {
            return true;
          }

          const userDashboard = getDefaultRedirectUrl(userRole);
          return router.createUrlTree([userDashboard]);
        })
      );
    })
  );
};

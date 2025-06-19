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
import { AuthStore } from 'src/app/core/auth/services/auth-store';
import { UserRole } from '../../enum/auth-roles.enum';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authStore = inject(AuthStore);

  return authStore.refreshSession$().pipe(
    take(1),
    switchMap((session) => {
      const isAuthenticated = !!session.tokens?.accessToken;
      if (!isAuthenticated) {
        return of(router.createUrlTree(['/login']));
      }
      const accessToken = session.tokens?.accessToken?.toString();
      if (!accessToken) {
        return of(router.createUrlTree(['/login']));
      }
      return authService.getUserRole$().pipe(
        take(1),
        map((userRole: UserRole) => {
          const requiredRoles: UserRole[] = route.data?.['roles'] || [];
          if (requiredRoles.length === 0) {
            return true;
          }
          const hasRequiredRole = requiredRoles.includes(userRole);

          if (hasRequiredRole) {
            return true;
          }
          return router.createUrlTree(['/unauthorized']);
        })
      );
    })
  );
};

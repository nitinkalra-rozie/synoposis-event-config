import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { UserRole } from '../../enum/auth-roles.enum';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    switchMap((isAuthenticated) => {
      if (!isAuthenticated) {
        return [router.createUrlTree(['/login'])];
      }
      return authService.getAccessToken().pipe(
        take(1),
        switchMap((accessToken) => {
          if (!accessToken) {
            return [router.createUrlTree(['/login'])];
          }
          return authService.getUserRole$().pipe(
            take(1),
            map((userRole: UserRole) => true)
          );
        })
      );
    }),
    catchError((error) => {
      console.error('🔥 Auth guard error:', error);
      return [router.createUrlTree(['/login'])];
    })
  );
};

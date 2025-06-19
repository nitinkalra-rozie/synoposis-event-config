import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

export const loginRedirectGuard: CanActivateFn = (): Observable<
  boolean | UrlTree
> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    take(1),
    switchMap((isAuth) => {
      console.log('[Guard] isAuthenticated:', isAuth);
      if (!isAuth) {
        return of(true);
      }
      return authService.getUserRole$().pipe(
        take(1),
        map((role) => {
          console.log('[Guard] User role:', role);
          if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
            return router.createUrlTree(['/av-workspace']);
          } else if (role === 'EDITOR') {
            return router.createUrlTree(['/insights-editor']);
          } else if (role === 'EVENT_ORGANIZER') {
            return router.createUrlTree(['/agenda']);
          } else {
            return router.createUrlTree(['/av-workspace']);
          }
        })
      );
    })
  );
};

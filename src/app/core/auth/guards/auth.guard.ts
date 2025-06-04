import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from 'src/app/core/auth/services/auth.service';
import { UserRole } from '../../enum/auth-roles.enum';

const validateUserAccess = (
  accessToken: string | null,
  currentUrl: string,
  userRole: UserRole
): boolean | string => (accessToken ? true : '/login');

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          this.router.navigate(['/login']);
          return of(false);
        }

        return combineLatest([
          this.authService.getAccessToken(),
          this.authService.getUserRole$(),
        ]).pipe(
          map(([accessToken, userRole]) => {
            const accessResult = validateUserAccess(
              accessToken,
              state.url,
              userRole
            );

            if (accessResult === true) {
              return true;
            }

            const redirectPath =
              typeof accessResult === 'string' ? accessResult : '/unauthorized';
            this.router.navigate([redirectPath]);
            return false;
          })
        );
      }),
      catchError((error) => {
        console.error('🔥 Auth guard error:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}

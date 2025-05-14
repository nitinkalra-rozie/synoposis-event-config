import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../legacy-admin/services/auth.service';
import { RoleRank } from '../../legacy-admin/shared/constants';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const accessToken = this.authService.getAccessToken();

    if (!accessToken) {
      console.log('No access token found. Redirecting to root.');
      this.router.navigate(['/']);
      return false;
    }

    const userRoleRank = this.authService.getUserRoleRank();

    const isAdminRoute = this.checkIfAdminRoute(route);
    if (
      isAdminRoute &&
      !(
        userRoleRank === RoleRank.ADMIN || userRoleRank === RoleRank.SUPER_ADMIN
      )
    ) {
      console.log('User is not authorized for admin route');

      if (userRoleRank === RoleRank.EVENT_ORGANIZER) {
        console.log('Redirecting to /analytics');
        this.router.navigate(['/analytics']);
      } else if (userRoleRank === RoleRank.EDITOR) {
        console.log('Redirecting to /insights-editor');
        this.router.navigate(['/insights-editor']);
      } else {
        console.log('Redirecting to root (default)');
        this.router.navigate(['/']);
      }
      return false;
    }

    return true;
  }

  private checkIfAdminRoute(route: ActivatedRouteSnapshot): boolean {
    if (route.routeConfig?.path?.includes('admin')) {
      return true;
    }

    return route.children.some((child) => this.checkIfAdminRoute(child));
  }
}

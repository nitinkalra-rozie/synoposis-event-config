import { Injectable } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './legacy-admin/services/auth.service';
import { RoleRank } from './legacy-admin/shared/constants';

@Injectable({
  providedIn: 'root',
})
// TODO:@now refactor this guard to use the new angular approach
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(state: RouterStateSnapshot): boolean {
    // This is a temporary implementation of checking if the user is authenticated. Check TODO below
    if (this.authService.getAccessToken()) {
      if (!this.authService.getAccessToken()) {
        this.router.navigate(['/']);
        return false;
      }

      // Get the user's role rank
      const userRoleRank = this.authService.getUserRoleRank();
      const isAdminRoute = state.root.children.some((child) =>
        child.routeConfig?.path?.includes('admin')
      );

      if (isAdminRoute && userRoleRank < RoleRank.ADMIN) {
        this.router.navigate(['/editorial']);
        return false;
      }

      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}

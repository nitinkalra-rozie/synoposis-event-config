import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  extractCustomPermissionsFromToken,
  validateUserAccess,
} from 'src/app/legacy-admin/@utils/auth-utils';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const redirectToLogin = this._router.parseUrl('/login');

    let accessToken: string | null;
    try {
      accessToken = this._authService.getAccessToken();
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return redirectToLogin;
    }

    if (!accessToken || this._authService.isTokenExpired()) {
      console.warn('Access token is either missing or expired');
      return redirectToLogin;
    }

    const currentUrl = state.url;
    let customPermissions: string[] = [];

    try {
      customPermissions = extractCustomPermissionsFromToken(accessToken);
    } catch (error) {
      console.warn('Failed to extract custom permissions from token:', error);
    }

    let accessResult: boolean | string;
    try {
      accessResult = validateUserAccess(
        accessToken,
        currentUrl,
        () => this._authService.getUserRole(),
        customPermissions
      );
    } catch (error) {
      console.error('Authorization check failed:', error);
      return redirectToLogin;
    }

    if (typeof accessResult === 'string') {
      return this._router.parseUrl(accessResult);
    }

    return accessResult ? true : redirectToLogin;
  }
}

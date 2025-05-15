import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import {
  authorizeAccess,
  getExtraPathsFromToken,
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
    let token: string | null;
    try {
      token = this._authService.getAccessToken();
    } catch (err) {
      console.error('Error retrieving token:', err);
      return this._router.parseUrl('/login');
    }

    if (!token || this._authService.isTokenExpired()) {
      console.warn('Token is missing or expired');
      return this._router.parseUrl('/login');
    }

    const targetUrl = state.url;

    let additionalPaths: string[] = [];
    try {
      additionalPaths = getExtraPathsFromToken(token) || [];
    } catch (err) {
      console.warn('Error extracting extra paths from token:', err);
    }

    let isAuthorizedOrRedirect: boolean | string;
    try {
      isAuthorizedOrRedirect = authorizeAccess(
        token,
        targetUrl,
        this._authService.getUserRole,
        additionalPaths
      );
    } catch (err) {
      console.error('Error during authorization check:', err);
      return this._router.parseUrl('/login');
    }

    return typeof isAuthorizedOrRedirect === 'string'
      ? this._router.parseUrl(isAuthorizedOrRedirect)
      : isAuthorizedOrRedirect;
  }
}

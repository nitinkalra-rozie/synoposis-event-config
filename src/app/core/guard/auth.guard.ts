import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { UserRole } from 'src/app/core/enum/auth-roles.enum';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';

export function getAllowedPaths(role: UserRole): string[] {
  switch (role) {
    case UserRole.SUPERADMIN:
      return [
        'admin',
        'insights-editor',
        'content-editor',
        'agenda',
        'analytics',
      ];
    case UserRole.ADMIN:
      return ['admin'];
    case UserRole.EVENTORGANIZER:
      return ['agenda', 'analytics'];
    case UserRole.EDITOR:
      return ['insights-editor', 'content-editor'];
    default:
      return [];
  }
}

export function isAllowed(url: string, allowedPaths: string[]): boolean {
  const path = url.startsWith('/') ? url.slice(1) : url;
  const segment = path.split('/')[0] || '';
  return allowedPaths.includes(segment);
}

export function getRedirectUrl(role: UserRole): string {
  switch (role) {
    case UserRole.EVENTORGANIZER:
      return '/analytics';
    case UserRole.EDITOR:
      return '/insights-editor';
    default:
      console.warn(
        `Unknown or unauthorized role (${role}), redirecting to root`
      );
      return '/';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const url = state.url;
    const token = this._authService.getAccessToken();

    return this.handleAuthorization(token, url);
  }

  private handleAuthorization(
    token: string | null,
    url: string
  ): boolean | UrlTree {
    if (!token) {
      console.warn('AuthGuard: No access token found. Redirecting to login.');
      return this._router.parseUrl('/login');
    }

    const role = this._authService.getUserRole();

    if (!role) {
      console.warn(
        'AuthGuard: User role is null or undefined. Redirecting to login.'
      );
      return this._router.parseUrl('/login');
    }

    const allowedPaths = getAllowedPaths(role);

    if (!isAllowed(url, allowedPaths)) {
      console.warn(
        `AuthGuard: Access denied for role "${role}" to path "${url}".`
      );
      return this._router.parseUrl(getRedirectUrl(role));
    }

    return true;
  }
}

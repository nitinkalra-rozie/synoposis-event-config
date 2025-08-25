import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { map, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthTokenService } from 'src/app/core/auth/services/auth-token';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
@Injectable({
  providedIn: 'root',
})
export class AuthRoleService {
  private readonly _tokenService = inject(AuthTokenService);

  isUserSuperAdmin$(): Observable<boolean> {
    return this._tokenService.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) {
          return false;
        }
        const decoded: JwtPayload = jwtDecode(accessToken);
        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        return normalizedEmail?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ?? false;
      })
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this._tokenService.getAccessToken$().pipe(
      map((accessToken) => {
        if (!accessToken) {
          return null;
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken);
        return decodedToken['cognito:groups'] || [];
      })
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this._tokenService.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return throwError(() => new Error('No access token available'));
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken);
        const email = decodedToken.email || decodedToken.username;
        if (email && email.endsWith(SUPER_ADMIN_EMAIL_DOMAIN)) {
          return of(UserRole.SuperAdmin);
        }

        return this.getUserGroups$().pipe(
          map((groups) => {
            if (!groups || groups.length === 0) {
              return UserRole.Editor;
            }

            if (groups.some((group) => group.includes('SUPER_ADMIN'))) {
              return UserRole.SuperAdmin;
            } else if (
              groups.some((group) => group.includes('CENTRALIZED_MANAGER'))
            ) {
              return UserRole.CentralizedManager;
            } else if (groups.some((group) => group.includes('ADMIN'))) {
              return UserRole.Admin;
            } else if (
              groups.some((group) => group.includes('EVENT_ORGANIZER'))
            ) {
              return UserRole.EventOrganizer;
            }

            return UserRole.Editor;
          })
        );
      })
    );
  }
}

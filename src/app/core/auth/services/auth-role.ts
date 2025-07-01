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

  isUserAdmin$(): Observable<boolean> {
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
          return of(UserRole.SUPERADMIN);
        }

        return this.getUserGroups$().pipe(
          map((groups) => {
            let role = UserRole.EDITOR;
            if (groups?.some((group) => group.includes('SUPER_ADMIN'))) {
              role = UserRole.SUPERADMIN;
            } else if (groups?.some((group) => group.includes('ADMIN'))) {
              role = UserRole.ADMIN;
            } else if (
              groups?.some((group) => group.includes('EVENT_ORGANIZER'))
            ) {
              role = UserRole.EVENTORGANIZER;
            }
            return role;
          })
        );
      })
    );
  }
}

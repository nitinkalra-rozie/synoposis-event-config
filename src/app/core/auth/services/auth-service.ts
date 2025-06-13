import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Amplify } from 'aws-amplify';
import {
  AuthTokens,
  fetchAuthSession,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';
import { from, interval, Observable, of } from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { amplifyConfig } from 'src/app/core/config/amplify-config';
import { JwtPayload, UserRole } from 'src/app/core/enum/auth-roles.enum';

const SUPER_ADMIN_EMAIL_DOMAIN = '@rozie.ai';
const TOKEN_CHECK_INTERVAL_MS = 60000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {
    Amplify.configure(amplifyConfig);
    this.startTokenCheck$();
  }

  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _isLoggingOut = signal<boolean>(false);

  logout$(): Observable<void> {
    if (this._isLoggingOut()) {
      return of(void 0);
    }
    this._isLoggingOut.set(true);
    return from(signOut({ global: true })).pipe(
      tap(() => {
        this._router.navigate(['/login'], { replaceUrl: true });
      }),
      map(() => void 0),
      finalize(() => {
        this._isLoggingOut.set(false);
      }),
      catchError(() => {
        this._router.navigate(['/login'], { replaceUrl: true });
        return of(void 0);
      })
    );
  }

  isUserAdmin$(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const accessToken = session.tokens?.accessToken?.toString();
        if (!accessToken) {
          return false;
        }
        const decoded: JwtPayload = jwtDecode(accessToken);
        const normalizedEmail = decoded?.username?.toLowerCase().trim();
        const isSuperAdmin =
          normalizedEmail?.endsWith(SUPER_ADMIN_EMAIL_DOMAIN) ?? false;
        return isSuperAdmin;
      })
    );
  }

  getAccessToken$(): Observable<string | null> {
    return from(fetchAuthSession()).pipe(
      map((session) => session.tokens?.accessToken?.toString() || null)
    );
  }

  getIdToken$(): Observable<string | null> {
    return from(fetchAuthSession()).pipe(
      map((session) => session.tokens?.idToken?.toString() || null)
    );
  }

  getUserEmail$(): Observable<string | null> {
    return from(getCurrentUser()).pipe(
      map((user) => user.signInDetails?.loginId || user.username)
    );
  }

  checkSession$(): Observable<boolean> {
    return from(getCurrentUser()).pipe(
      switchMap((user) =>
        from(fetchAuthSession()).pipe(
          tap((session) => {
            if (!session.tokens) {
              throw new Error('No valid session tokens');
            }
            this.logAllTokens(session.tokens);
          }),
          map(() => true)
        )
      )
    );
  }

  getUserGroups$(): Observable<string[] | null> {
    return this.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(null);
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken);
        const userGroups = decodedToken['cognito:groups'] || [];
        return of(userGroups);
      })
    );
  }

  getUserRole$(): Observable<UserRole | null> {
    return this.getAccessToken$().pipe(
      switchMap((accessToken) => {
        if (!accessToken) {
          return of(null);
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

  isTokenExpired$(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const accessToken = session.tokens?.accessToken;
        if (!accessToken) {
          return true;
        }
        const decodedToken: JwtPayload = jwtDecode(accessToken.toString());
        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();
        const isExpired = currentTime >= expirationTime;

        return isExpired;
      })
    );
  }

  isAuthenticated(): Observable<boolean> {
    return from(fetchAuthSession()).pipe(
      map((session) => {
        const isAuthenticated = !!session.tokens?.accessToken;
        if (isAuthenticated) {
          this.logAllTokens(session.tokens);
        }
        return isAuthenticated;
      })
    );
  }

  private logAllTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      jwtDecode(tokens.accessToken.toString());
    }
    if (tokens.idToken) {
      jwtDecode(tokens.idToken.toString());
    }
  }

  private startTokenCheck$(): void {
    interval(TOKEN_CHECK_INTERVAL_MS)
      .pipe(
        filter(() => !this._isLoggingOut()),
        filter(
          () =>
            !this._route.snapshot.children?.[0]?.routeConfig?.path?.includes(
              'otp'
            )
        ),
        takeUntilDestroyed(this._destroyRef),
        switchMap(() => this.runTokenCheck$())
      )
      .subscribe();
  }

  private runTokenCheck$(): Observable<void> {
    if (this._isLoggingOut()) {
      return of(void 0);
    }

    return from(fetchAuthSession()).pipe(
      switchMap((session) => {
        if (!session.tokens?.accessToken) {
          return this.logout$();
        } else {
          return of(void 0);
        }
      })
    );
  }
}

import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  confirmSignIn,
  getCurrentUser,
  signIn,
  SignInInput,
  SignInOutput,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import {
  catchError,
  EMPTY,
  finalize,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  AUTH_EXCEPTIONS,
  AUTH_FLOW_TYPES,
  DEV_SANDBOX_DOMAIN,
  SIGN_IN_STEPS,
} from 'src/app/core/auth/constants/auth-constants';
import { authErrorHandlerFn } from 'src/app/core/auth/error-handling/auth-error-handler-fn';
import {
  AuthSession,
  CustomChallengeResponse,
} from 'src/app/core/auth/models/auth.model';
import { AuthStore } from 'src/app/core/auth/stores/auth-store';
import { generateSecurePassword } from 'src/app/core/auth/utils/auth-utils';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authStore = inject(AuthStore);

  private _lastAuthEmail: string | null = null;

  signUp$(email: string): Observable<CustomChallengeResponse> {
    return this._authStore.getSession$().pipe(
      takeUntilDestroyed(this._destroyRef),
      switchMap((session) => {
        if (session.tokens?.accessToken) {
          return of({
            success: true,
            message: 'User already signed in',
          } satisfies CustomChallengeResponse);
        }
        const resolvedDomain = this._resolveDomainFromHostname(
          window.location.hostname
        );
        this._lastAuthEmail = email;

        return from(
          signUp({
            username: email,
            password: generateSecurePassword(),
            options: {
              userAttributes: {
                email,
                'custom:domain': resolvedDomain,
              },
              clientMetadata: { domain: resolvedDomain },
            },
          })
        ).pipe(
          switchMap(() => this._performSignIn$(email)),
          catchError((error) => {
            const errorName = (error && (error.name || error.code)) || '';
            if (errorName === AUTH_EXCEPTIONS.USERNAME_EXISTS_EXCEPTION) {
              return this._performSignIn$(email);
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  OTPVerification$(otp: string): Observable<boolean> {
    const hostname = window.location.hostname;
    const resolvedDomain = this._resolveDomainFromHostname(hostname);
    const clientMetadata: Record<string, string> = {
      domain: resolvedDomain,
      username: this._lastAuthEmail || '',
    };
    return from(
      confirmSignIn({
        challengeResponse: otp,
        options: { clientMetadata },
      })
    ).pipe(
      takeUntilDestroyed(this._destroyRef),
      tap(() => {
        this._authStore.invalidateCache();
      }),
      map((result: SignInOutput) => result.isSignedIn)
    );
  }

  resendOtp$(email: string): Observable<CustomChallengeResponse> {
    return this._performSignIn$(email).pipe(
      takeUntilDestroyed(this._destroyRef)
    );
  }

  logout$(): Observable<void> {
    if (this._authStore.$isLoggingOut()) {
      return EMPTY;
    }

    this._authStore.setIsLoggingOut(true);

    return from(signOut({ global: true })).pipe(
      tap(() => {
        this._authStore.invalidateCache();
        this._router.navigate(['/login']);
      }),
      finalize(() => {
        this._authStore.setIsLoggingOut(false);
      }),
      catchError((error) => {
        this._router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  getUserEmail$(): Observable<string | null> {
    return from(getCurrentUser()).pipe(
      map((user) => user.signInDetails?.loginId || user.username),
      catchError((error) => authErrorHandlerFn()<string>(error, false))
    );
  }

  checkSession$(): Observable<AuthSession> {
    return from(getCurrentUser()).pipe(
      switchMap(() => this._authStore.getSession$()),
      catchError((error) => {
        authErrorHandlerFn()(error, false);
        return this._authStore.getSession$().pipe(
          map((session) => ({
            ...session,
            isAuthenticated: false,
            tokens: null,
          }))
        );
      })
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this._authStore
      .getSession$()
      .pipe(map((session) => session.isAuthenticated));
  }

  private _performSignIn$(email: string): Observable<CustomChallengeResponse> {
    this._lastAuthEmail = email;
    const hostname = window.location.hostname;
    const resolvedDomain = this._resolveDomainFromHostname(hostname);
    const signInInput: SignInInput = {
      username: email,
      options: {
        authFlowType: AUTH_FLOW_TYPES.CUSTOM_WITHOUT_SRP,
        clientMetadata: {
          username: email,
          domain: resolvedDomain,
        },
      },
    };

    return from(signIn(signInInput)).pipe(
      map((result: SignInOutput) => {
        if (result.isSignedIn) {
          return {
            success: true,
            message: 'User signed in successfully',
          } satisfies CustomChallengeResponse;
        }

        if (
          result.nextStep?.signInStep ===
          SIGN_IN_STEPS.CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE
        ) {
          return {
            success: true,
            message: 'OTP sent successfully',
          } satisfies CustomChallengeResponse;
        }

        return {
          success: false,
          message: 'Unexpected authentication flow',
        } satisfies CustomChallengeResponse;
      })
    );
  }

  private _resolveDomainFromHostname(hostname: string): string {
    if (hostname === 'localhost') {
      return DEV_SANDBOX_DOMAIN;
    }
    return hostname;
  }
}

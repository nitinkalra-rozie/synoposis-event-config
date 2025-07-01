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
  AUTH_FLOW_TYPES,
  SIGN_IN_STEPS,
} from 'src/app/core/auth/constants/auth-constants';
import {
  AuthSession,
  CustomChallengeResponse,
} from 'src/app/core/auth/models/auth.model';
import { AuthStore } from 'src/app/core/auth/stores/auth-store';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authStore = inject(AuthStore);

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
        return this._performSignIn$(email);
      })
    );
  }

  OTPVerification$(otp: string): Observable<boolean> {
    return from(confirmSignIn({ challengeResponse: otp })).pipe(
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

    this._authStore.$isLoggingOut.set(true);

    return from(signOut({ global: true })).pipe(
      tap(() => {
        this._authStore.invalidateCache();
        this._router.navigate(['/login']);
      }),
      finalize(() => {
        this._authStore.$isLoggingOut.set(false);
      }),
      catchError((error) => {
        this._router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  getUserEmail$(): Observable<string | null> {
    return from(getCurrentUser()).pipe(
      map((user) => user.signInDetails?.loginId || user.username)
    );
  }

  checkSession$(): Observable<AuthSession> {
    return from(getCurrentUser()).pipe(
      switchMap(() => this._authStore.getSession$())
    );
  }

  isAuthenticated$(): Observable<boolean> {
    return this._authStore
      .getSession$()
      .pipe(map((session) => session.isAuthenticated));
  }

  private _performSignIn$(email: string): Observable<CustomChallengeResponse> {
    const signInInput: SignInInput = {
      username: email,
      options: {
        authFlowType: AUTH_FLOW_TYPES.CUSTOM_WITHOUT_SRP,
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
}

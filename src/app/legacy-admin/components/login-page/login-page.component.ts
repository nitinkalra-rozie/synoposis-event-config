import { Component, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { CommonModule } from '@angular/common';
import { AuthApiService } from 'src/app/core/auth/services/auth-api-service';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { FooterMobileComponent } from '../shared/footer-mobile/footer-mobile.component';
import { FooterComponent } from '../shared/footer/footer.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  imports: [
    CommonModule,
    FooterComponent,
    FooterMobileComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class LoginPageComponent {
  private readonly fb = inject(UntypedFormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly _authApiService = inject(AuthApiService);

  emailForm: UntypedFormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  errorMessage = '';
  requestingAccess = false;
  isEmailValid = false;
  processedClicked = false;

  handleEmailChange(): void {
    const email = this.emailForm.get('email')?.value;
    this.isEmailValid = this.validateEmail(email);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleSignUp(): void {
    const email = this.emailForm.get('email')?.value;
    if (this.emailForm.valid && this.isEmailValid) {
      this.processedClicked = true;
      this.errorMessage = '';

      this._authApiService
        .signUp(email)
        .pipe(
          finalize(() => {
            this.processedClicked = false;
          }),
          catchError((error) => {
            console.error('Sign up failed', error);
            this.errorMessage = 'An error occurred while signing up.';
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response?.success) {
            this.router.navigate(['/otp'], { queryParams: { email } });
          } else if (response) {
            this.errorMessage = response.message;
          }
        });
    }
  }

  handleRequestAccess(): void {
    const email = this.emailForm.get('email')?.value;
    if (!email) return;

    this.requestingAccess = true;
    this.errorMessage = '';

    this._authApiService
      .requestAccess(email)
      .pipe(
        catchError((error) => {
          console.error('Error requesting access', error);
          this.errorMessage = 'An error occurred while requesting access.';
          return of(false);
        }),
        finalize(() => {
          setTimeout(() => {
            this.requestingAccess = false;
          }, 5000);
        })
      )
      .subscribe((success) => {
        if (success) {
          this.emailForm.reset();
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Failed to send access request.';
        }
      });
  }
}

import { Component, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthApiService } from 'src/app/core/auth/services/auth-api-service';
import { AuthService } from 'src/app/core/auth/services/auth-data-service';
import { FooterMobileComponent } from '../shared/footer-mobile/footer-mobile.component';
import { FooterComponent } from '../shared/footer/footer.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  imports: [
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

import { Component, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, tap } from 'rxjs/operators';
import { AuthDataService } from 'src/app/core/auth/data-service/auth-data-service';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { FooterMobileComponent } from 'src/app/legacy-admin/components/shared/footer-mobile/footer-mobile.component';
import { FooterComponent } from 'src/app/legacy-admin/components/shared/footer/footer.component';

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
  private readonly _fb = inject(UntypedFormBuilder);
  private readonly _router = inject(Router);
  private readonly _authApiService = inject(AuthDataService);
  private readonly _authFacade = inject(AuthFacade);

  emailForm: UntypedFormGroup = this._fb.group({
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

      this._authFacade
        .signUp$(email)
        .pipe(
          tap((response) => {
            if (response?.success) {
              this._router.navigate(['/otp'], { queryParams: { email } });
            } else if (response) {
              this.errorMessage = response.message;
            }
          }),
          finalize(() => {
            this.processedClicked = false;
          })
        )
        .subscribe();
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
        tap((success) => {
          if (success) {
            this.emailForm.reset();
            this.errorMessage = '';
          } else {
            this.errorMessage = 'Failed to send access request.';
            this.requestingAccess = false;
          }
        })
      )
      .subscribe();
  }
}

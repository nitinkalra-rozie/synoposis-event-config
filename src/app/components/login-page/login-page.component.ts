import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LoginService } from 'src/app/services/login.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  emailForm: FormGroup;
  errorMessage: string = '';
  requestingAccess: boolean = false;
  isEmailValid: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private loginService: LoginService
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  handleEmailChange() {
    const email = this.emailForm.get('email').value;
    this.isEmailValid = this.validateEmail(email);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async handleSignUp() {
    const email = this.emailForm.get('email').value;
    if (this.emailForm.valid && this.isEmailValid) {
      try {
        const response = await this.loginService.signUp(email).toPromise();
        if (response.success) {
          this.router.navigate(['/otp'], { queryParams: { email } });
        } else {
          this.errorMessage = response.message;
        }
      } catch (error) {
        console.error('Sign up failed', error);
        this.errorMessage = 'An error occurred while signing up.';
      }
    }
  }

  async handleRequestAccess() {
    const email = this.emailForm.get('email').value;
    this.requestingAccess = true;
    try {
      const success = await this.loginService.requestAccess(email).toPromise();
      if (success) {
        this.emailForm.reset();
        this.errorMessage = '';
      } else {
        this.errorMessage = 'Failed to send access request.';
      }
    } catch (error) {
      console.error('Error requesting access', error);
      this.errorMessage = 'An error occurred while requesting access.';
    } finally {
      setTimeout(() => {
        this.requestingAccess = false;
      }, 5000);
    }
  }
}

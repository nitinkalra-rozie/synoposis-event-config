import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { AuthApiService } from 'src/app/core/auth/services/auth-api.service';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { FooterMobileComponent } from '../shared/footer-mobile/footer-mobile.component';
import { FooterComponent } from '../shared/footer/footer.component';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
  imports: [FooterComponent, FormsModule, FooterMobileComponent],
})
export class OtpComponent implements OnInit {
  otp: string[] = ['', '', '', '', '', ''];
  resendClicked = false;
  submitPressed = false;
  email = '';
  errorMessage = '';

  @ViewChild('inputs') inputsRef: ElementRef | undefined;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly _authApiService = inject(AuthApiService);

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    this.email = urlParams.get('email') || '';
    console.log('📱 OTP component initialized for email:', this.email);
  }

  handleOtpChange(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    if (!isNaN(Number(value)) && value.length === 1) {
      this.otp[index] = value;
      if (this.otp.every((digit) => digit !== '')) {
        this.handleSubmit();
        return;
      }

      if (index < this.otp.length - 1) {
        const nextInput = this.inputsRef.nativeElement.children[
          index + 1
        ] as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  }

  handleKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (index > 0 && this.otp[index] === '') {
        this.otp[index - 1] = '';
        const prevInput = this.inputsRef.nativeElement.children[
          index - 1
        ] as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      } else if (this.otp[index] !== '') {
        this.otp[index] = '';
      }
    } else if (event.key === 'ArrowLeft') {
      if (index > 0) {
        const prevInput = this.inputsRef.nativeElement.children[
          index - 1
        ] as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    } else if (event.key === 'ArrowRight') {
      if (index < this.otp.length - 1) {
        const nextInput = this.inputsRef.nativeElement.children[
          index + 1
        ] as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  }

  handleSubmit(): void {
    this.submitPressed = true;
    this.errorMessage = '';

    if (!this.email) {
      console.error('❌ Email is null');
      this.submitPressed = false;
      return;
    }

    const inputOtp = this.otp.join('');
    this._authApiService
      .OTPVerification(this.email, inputOtp)
      .pipe(
        switchMap((success) => {
          if (success) {
            return this.authService.checkSession$().pipe(
              switchMap(() => {
                this.router.navigate(['/admin']);
                return of(true);
              }),
              catchError((error) => {
                console.error('❌ Session validation failed:', error);
                this.errorMessage =
                  'Session validation failed. Please try again.';
                return of(false);
              })
            );
          } else {
            this.errorMessage = 'Wrong OTP!';
            console.error('❌ OTP verification failed');
            return of(false);
          }
        }),
        catchError((error) => {
          this.errorMessage = 'Wrong OTP!';
          console.error('❌ Error during OTP verification:', error);
          return of(false);
        }),
        finalize(() => {
          this.submitPressed = false;
        })
      )
      .subscribe();
  }

  handleResendOTP(): void {
    this.resendClicked = true;

    this._authApiService
      .resendOtp(this.email)
      .pipe(
        finalize(() => {
          this.resendClicked = false;
        }),
        catchError((error) => {
          console.error('❌ Error during OTP resend:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') ?? '';
    const otpArray = pasteData.split('').slice(0, 6);
    this.otp = otpArray;

    const lastIndex = otpArray.length - 1;
    if (this.otp.every((digit) => digit !== '')) {
      this.handleSubmit();
      return;
    }

    const lastInput = this.inputsRef?.nativeElement.children[
      lastIndex
    ] as HTMLInputElement;
    lastInput?.focus();
  }
}

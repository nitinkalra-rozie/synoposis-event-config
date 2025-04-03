import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/legacy-admin/services/login.service'; // Ensure this import path is correct
import { AuthResponse } from 'src/app/legacy-admin/shared/types';
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

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    this.email = urlParams.get('email') || '';
  }

  handleOtpChange(index: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    if (!isNaN(Number(value)) && value.length === 1) {
      this.otp[index] = value;
      if (this.otp.every((digit) => digit !== '')) {
        this.handleSubmit();
        return;
      }

      // Move focus to the next input
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

  handleKeyDown(index: number, event: KeyboardEvent) {
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

  trackByFn(index: number, obj: any) {
    return index;
  }

  handleSubmit() {
    this.submitPressed = true;
    this.errorMessage = '';
    if (!this.email) {
      console.error('Email is null');
      return;
    }

    const inputOtp = this.otp.join('');

    this.loginService.OTPVerification(this.email, inputOtp).subscribe(
      (responseData: AuthResponse | null) => {
        this.submitPressed = false;
        if (
          responseData &&
          responseData.AuthenticationResult &&
          responseData.AuthenticationResult.AccessToken
        ) {
          this.router.navigate(['/admin']);
        } else {
          this.errorMessage = 'Wrong otp!';
          console.error('OTP verification failed or no token received');
        }
      },
      (error) => {
        this.submitPressed = false;
        this.errorMessage = 'Wrong otp!';
        console.error('Error during OTP verification', error);
      }
    );
  }

  async handleResendOTP() {
    try {
      this.resendClicked = true;
      await this.loginService.signUp(this.email).toPromise();
    } catch (error) {
      console.error('Error during OTP resend', error);
    }
  }

  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData.getData('text');
    const otpArray = pasteData.split('').slice(0, 6);

    this.otp = otpArray;
    const lastIndex = otpArray.length - 1;
    if (this.otp.every((digit) => digit !== '')) {
      this.handleSubmit();
      return;
    }
    const lastInput = this.inputsRef.nativeElement.children[
      lastIndex
    ] as HTMLInputElement;
    if (lastInput) {
      lastInput.focus();
    }
  }
}

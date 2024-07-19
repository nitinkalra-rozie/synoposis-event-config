import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/services/login.service'; // Ensure this import path is correct
import { AuthResponse } from 'src/app/shared/types';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.css'] // Ensure this path is correct
})
export class OtpComponent implements OnInit {
  otp: string[] = ['', '', '', '', '', ''];
  resendClicked = false;
  email: string = '';
  errorMessage: string;
  @ViewChild('inputs') inputsRef: ElementRef | undefined;

  constructor(private router: Router, private loginService: LoginService) { }

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    this.email = urlParams.get('email') || '';
  }

  handleOtpChange(index: number, value: string) {
    // Ensure that only a single digit is accepted
    if (!isNaN(Number(value)) && value.length === 1) {
      this.otp[index] = value;

      // Move focus to the next input
      if (index < this.otp.length - 1) {
        const nextInput = this.inputsRef && this.inputsRef.nativeElement.children[index + 1];
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }

      // Submit when all digits are filled
      if (this.otp.every(digit => digit !== '')) {
        this.handleSubmit();
      }
    }
  }

  handleKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && index > 0 && this.otp[index] === '') {
      const prevInput = this.inputsRef && this.inputsRef.nativeElement.children[index - 1];
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  }

  handleSubmit() {
    this.errorMessage="";
    if (!this.email) {
      console.error('Email is null');
      return;
    }

    const inputOtp = this.otp.join('');

    this.loginService.OTPVerification(this.email, inputOtp).subscribe(
      (responseData: AuthResponse | null) => {
        if (responseData && responseData.AuthenticationResult && responseData.AuthenticationResult.IdToken) {
          console.log("sid auth ",responseData.AuthenticationResult.IdToken);
          this.router.navigate(['/admin']);
        } else {
          this.errorMessage="Wrong otp!"
          console.error('OTP verification failed or no token received');
        }
      },
      (error) => {
        this.errorMessage="Wrong otp!"
        console.error('Error during OTP verification', error);
      }
    );
  }

  async handleResendOTP() {
    try {
      await this.loginService.resendOtp(this.email);
      this.resendClicked = true;
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
    const lastInput = this.inputsRef && this.inputsRef.nativeElement.children[lastIndex];
    if (lastInput) {
      (lastInput as HTMLInputElement).focus();
    }
  }
}

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.css']
})
export class OtpComponent implements OnInit {
  resendClicked: boolean = false;
  otp: string[] = ['', '', '', ''];
  email: string | null = '';
  constructor() { }

  ngOnInit() {
  }
  handleOtpChange(index: number, value: string): void {
    console.log('handleOtpChange called with index:', index, 'value:', value);
  
  }
  handleSubmit(){

  }
  handleResendOTP(){}
}

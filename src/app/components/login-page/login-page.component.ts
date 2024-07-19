import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent  {

    emailForm: FormGroup;
    errorMessage: string = '';
    requestingAccess: boolean = false;
  
    constructor(
      private fb: FormBuilder,
      private router: Router
    ) {
      this.emailForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
      });
    }
  
    handleSignUp() {
      const email = this.emailForm.get('email').value;
      // Handle sign up logic here...
    }
  
    handleRequestAccess() {
      const email = this.emailForm.get('email').value;
      this.router.navigate(['/otp']); 
      // Handle request access logic here...
    }
  }
  


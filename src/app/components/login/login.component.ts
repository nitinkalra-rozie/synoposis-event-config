import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CognitoService } from 'src/app/services/cognito.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  emailaddress: string = '';
  password: string = '';

  constructor(private authservice: CognitoService) {
  }

  onSignIn(form: NgForm) {
    if (form.valid) {
      this.authservice.login(this.emailaddress, this.password)
 
    }
  }
}
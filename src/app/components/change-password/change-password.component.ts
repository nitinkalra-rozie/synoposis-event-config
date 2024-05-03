import { Component } from '@angular/core';
import { CognitoService } from 'src/app/services/cognito.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  currentpassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private authService : CognitoService) {
  }

  confirmPasswordReset() {
    this.authService.changePassword(this.currentpassword, this.newPassword, this.confirmPassword)
  }
}
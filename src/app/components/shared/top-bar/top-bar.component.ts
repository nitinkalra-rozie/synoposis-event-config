import { Component } from '@angular/core';
import { CognitoService } from 'src/app/services/cognito.service';
@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {
  showDropdown: boolean = false;
  constructor(private cognitoService :CognitoService){}

  toggleDropdown() {
    console.log('Profile picture clicked');
    this.showDropdown = !this.showDropdown;
    console.log('showDropdown:', this.showDropdown);
  }

  onOutsideClick() {
    console.log('Outside click detected');
    this.showDropdown = false;
  }

  logout() {
    console.log('Logout clicked');
    this.cognitoService.logOut();
  }
}

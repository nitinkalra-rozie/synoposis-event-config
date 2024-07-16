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
    this.showDropdown = !this.showDropdown;
  }

  onOutsideClick() {
    this.showDropdown = false;
  }

  logout() {
    this.cognitoService.logOut();
  }
}

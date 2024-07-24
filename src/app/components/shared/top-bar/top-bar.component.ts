import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css'],
})
export class TopBarComponent {
  showDropdown: boolean = false;
  constructor(
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  onOutsideClick() {
    this.showDropdown = false;
  }

  handleNoSelect = () => {
    this.modalService.close();
  };

  handleYesSelect = () => {
    this.modalService.close();
    this.authService.logout();
  };

  showModal() {
    this.modalService.open(
      'Confirm Action',
      'Are you sure you want to log out?',
      'yes_no',
      this.handleYesSelect,
      this.handleNoSelect
    );
  }

  logout() {
    this.showModal();
  }
}

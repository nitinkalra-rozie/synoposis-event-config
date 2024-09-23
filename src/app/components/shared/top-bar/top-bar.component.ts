import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
import { OutsideClickDirective } from '../../../directives/outside-click.directive';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
  standalone: true,
  imports: [
    SideBarComponent,
    OutsideClickDirective,
    MatIconModule,
    MatMenuModule,
  ],
})
export class TopBarComponent {
  constructor(
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  protected showDropdown = false;

  protected toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  protected onOutsideClick(): void {
    this.showDropdown = false;
  }

  protected logout(): void {
    this.showModal();
  }

  private handleNoSelect = (): void => {
    this.modalService.close();
  };

  private handleYesSelect = (): void => {
    this.modalService.close();
    this.authService.logout();
  };

  private showModal(): void {
    this.modalService.open(
      'Confirm Action',
      'Are you sure you want to log out?',
      'yes_no',
      this.handleYesSelect,
      this.handleNoSelect
    );
  }
}

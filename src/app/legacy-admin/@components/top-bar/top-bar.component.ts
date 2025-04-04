import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SideNavComponent } from 'src/app/legacy-admin/@components/side-nav/side-nav.component';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';
import { OutsideClickDirective } from '../../../legacy-admin/directives/outside-click.directive';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
  imports: [
    SideNavComponent,
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

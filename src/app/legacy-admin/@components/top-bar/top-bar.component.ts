import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { finalize } from 'rxjs';
import { SideNavComponent } from 'src/app/legacy-admin/@components/side-nav/side-nav.component';

import { AuthService } from 'src/app/core/auth/services/auth.service';
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
  private readonly _authService = inject(AuthService);
  private readonly _modalService = inject(ModalService);

  protected showDropdown = false;
  protected isLoggingOut = false;

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
    this._modalService.close();
  };

  private handleYesSelect = (): void => {
    this._modalService.close();
    this.performLogout();
  };

  private performLogout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.showDropdown = false;

    this._authService
      .logout()
      .pipe(
        finalize(() => {
          this.isLoggingOut = false;
        })
      )
      .subscribe({
        next: () => {
          console.log('✅ Logout successful');
        },
        error: (error) => {
          console.error('❌ Logout error:', error);
        },
      });
  }

  private showModal(): void {
    this._modalService.open(
      'Confirm Action',
      'Are you sure you want to log out?',
      'yes_no',
      this.handleYesSelect,
      this.handleNoSelect
    );
  }
}

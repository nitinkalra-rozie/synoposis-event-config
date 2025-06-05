import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { SideNavComponent } from 'src/app/legacy-admin/@components/side-nav/side-nav.component';
import { OutsideClickDirective } from 'src/app/legacy-admin/directives/outside-click.directive';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';

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
  public readonly showDropdown = signal(false);
  private readonly _authService = inject(AuthService);
  private readonly _modalService = inject(ModalService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _isLoggingOut = signal(false);

  protected toggleDropdown(): void {
    this.showDropdown.set(!this.showDropdown());
  }

  protected onOutsideClick(): void {
    this.showDropdown.set(false);
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
    if (this._isLoggingOut()) {
      return;
    }

    this._isLoggingOut.set(true);
    this.showDropdown.set(false);

    this._authService
      .logout()
      .pipe(
        finalize(() => {
          this._isLoggingOut.set(false);
        }),
        takeUntilDestroyed(this._destroyRef)
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

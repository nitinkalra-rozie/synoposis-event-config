import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/core/auth/services/auth-service';
import { AuthStore } from 'src/app/core/auth/services/auth-store';
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
  private readonly _authService = inject(AuthService);
  private readonly _authStore = inject(AuthStore);
  private readonly _modalService = inject(ModalService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  public showDropdown = signal(false);

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
    console.log('[TopBar] Logging out...');
    this.showDropdown.set(false);

    const startTime = performance.now();

    this._authService
      .logout$()
      .pipe(
        finalize(() => {
          const elapsed = performance.now() - startTime;
          console.log(`[TopBar] Logout finalized in ${elapsed.toFixed(2)}ms`);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: () => {
          console.log('[TopBar] Navigating to /login');
          this._router.navigate(['/login'], { replaceUrl: true }).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          console.error('[TopBar] Logout error:', err);
          this._router.navigate(['/login'], { replaceUrl: true });
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

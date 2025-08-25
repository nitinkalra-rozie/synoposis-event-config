import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
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
  private readonly _modalService = inject(ModalService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _authFacade = inject(AuthFacade);

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
    this.showDropdown.set(false);

    this._authFacade
      .logout$()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => {
          this._router.navigate(['/login']);
          return EMPTY;
        })
      )
      .subscribe();
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

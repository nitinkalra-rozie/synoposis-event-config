import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';

@Component({
  selector: 'app-layout-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-header.component.html',
  styleUrl: './layout-header.component.scss',
  imports: [MatMenuModule, MatButtonModule, MatIconModule],
})
export class LayoutHeaderComponent {
  public readonly title = input.required<string>();
  public readonly showBoxShadow = input.required<boolean>();

  private readonly _modalService = inject(ModalService);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  protected logout(): void {
    this._showModal();
  }

  private _showModal(): void {
    const handleYesSelect = (): void => {
      this._modalService.close();
      this._performLogout();
    };

    const handleNoSelect = (): void => {
      this._modalService.close();
    };

    this._modalService.open(
      'Confirm Action',
      'Are you sure you want to log out?',
      'yes_no',
      handleYesSelect,
      handleNoSelect
    );
  }

  private _performLogout(): void {
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
}

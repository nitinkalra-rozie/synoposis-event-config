import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from 'src/app/core/auth/services/auth-service';
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

  private readonly _authService = inject(AuthService);
  private readonly _modalService = inject(ModalService);

  protected logout(): void {
    this._showModal();
  }

  private _showModal(): void {
    const handleYesSelect = (): void => {
      this._modalService.close();
      this._authService.logout$();
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
}

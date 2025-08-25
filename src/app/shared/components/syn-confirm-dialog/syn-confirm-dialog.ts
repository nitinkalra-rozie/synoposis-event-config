import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SynConfirmDialogData } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog.model';

@Component({
  selector: 'syn-confirm-dialog',
  templateUrl: './syn-confirm-dialog.html',
  styleUrl: './syn-confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class SynConfirmDialog {
  public readonly data = inject<SynConfirmDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(MatDialogRef<SynConfirmDialog, boolean>);

  protected onConfirm(): void {
    this._dialogRef.close(true);
  }

  protected onCancel(): void {
    this._dialogRef.close(false);
  }
}

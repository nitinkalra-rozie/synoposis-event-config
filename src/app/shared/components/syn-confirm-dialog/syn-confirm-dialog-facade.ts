import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { SynConfirmDialog } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog';
import { SynConfirmDialogData } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class SynConfirmDialogFacade {
  private readonly _dialog = inject(MatDialog);

  openConfirmDialog(data: SynConfirmDialogData): Observable<boolean> {
    return this._dialog
      .open(SynConfirmDialog, {
        data,
        panelClass: 'syn-confirm-dialog-panel',
        width: '420px',
      })
      .afterClosed();
  }
}

import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from 'src/app/legacy-admin/@components/custom-snackbar/custom-snackbar.component';
import { SnackbarData } from 'src/app/legacy-admin/@data-services/snackbar/snackbar-data-model';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private _snackBar = inject(MatSnackBar);

  success(
    message: string,
    action?: string,
    duration: number = 3000
  ): MatSnackBarRef<CustomSnackbarComponent> {
    return this.showSnackbar({ message, type: 'success', action }, duration);
  }

  error(
    message: string,
    action?: string,
    duration: number = 5000
  ): MatSnackBarRef<CustomSnackbarComponent> {
    return this.showSnackbar({ message, type: 'error', action }, duration);
  }

  warning(
    message: string,
    action?: string,
    duration: number = 4000
  ): MatSnackBarRef<CustomSnackbarComponent> {
    return this.showSnackbar({ message, type: 'warning', action }, duration);
  }

  info(
    message: string,
    action?: string,
    duration: number = 3000
  ): MatSnackBarRef<CustomSnackbarComponent> {
    return this.showSnackbar({ message, type: 'info', action }, duration);
  }

  private showSnackbar(
    data: SnackbarData,
    duration: number = 3000
  ): MatSnackBarRef<CustomSnackbarComponent> {
    return this._snackBar.openFromComponent(CustomSnackbarComponent, {
      data,
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`snackbar-${data.type}`, 'custom-snackbar-container'],
    });
  }
}

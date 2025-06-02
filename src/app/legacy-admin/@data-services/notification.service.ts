import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AlertTypes } from 'src/app/legacy-admin/shared/types';
import { SnackbarComponent } from 'src/app/shared/snackbar/snackbar.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private _snackBar: MatSnackBar) {}

  success(
    title = 'Success',
    message = 'Record Added Successfully!',
    duration = 3000,
    config = null
  ): void {
    this.showNotification(title, message, AlertTypes.Success, duration, config);
  }

  error(
    title = 'Error',
    message = 'Failed!',
    duration = 3000,
    config = null
  ): void {
    this.showNotification(title, message, AlertTypes.Error, duration, config);
  }

  info(
    title = 'Info',
    message = 'Information',
    duration = 3000,
    config = null
  ): void {
    this.showNotification(title, message, AlertTypes.Info, duration, config);
  }

  warning(
    title = 'Warning',
    message = 'Warning message',
    duration = 3000,
    config = null
  ): void {
    this.showNotification(title, message, AlertTypes.Warning, duration, config);
  }

  processing(
    title = 'Processing',
    message = 'Please wait...',
    duration = 3000,
    config = null
  ): void {
    this.showNotification(
      title,
      message,
      AlertTypes.Processing,
      duration,
      config
    );
  }

  private showNotification(
    title: string,
    message: string,
    type: AlertTypes,
    duration: number,
    config: null
  ): void {
    this._snackBar.openFromComponent(SnackbarComponent, {
      duration: duration,
      panelClass: ['custom-error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      data: {
        title: title,
        message: message,
        status: type,
        config: config,
      },
    });
  }
}

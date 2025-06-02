import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { AlertTypes } from 'src/app/legacy-admin/shared/enums';
// import { AlertTypes } from '../legacy-admin/shared/types';

export interface SnackBarData {
  title: string;
  message: string;
  status: AlertTypes;
  config?: any;
}

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent {
  constructor(
    public snackBarRef: MatSnackBarRef<SnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackBarData
  ) {}
  public icons = {
    [AlertTypes.Success]: 'file_download_done',
    [AlertTypes.Error]: 'report_problem',
    [AlertTypes.Warning]: 'warning',
    [AlertTypes.Info]: 'info',
    [AlertTypes.Processing]: 'sync',
  };

  onButtonClick(): void {
    if (this.data.config?.action) {
      this.data.config.action();
    }
    this.close();
  }

  close(): void {
    this.snackBarRef.dismiss();
  }

  isCompact(): boolean {
    return (
      !this.data.message ||
      !this.data.title ||
      this.data.message === '' ||
      this.data.title === ''
    );
  }

  isSuccess(): boolean {
    return this.data.status === AlertTypes.Success;
  }

  isError(): boolean {
    return this.data.status === AlertTypes.Error;
  }

  isWarning(): boolean {
    return this.data.status === AlertTypes.Warning;
  }

  isInfo(): boolean {
    return this.data.status === AlertTypes.Info;
  }

  isProcessing(): boolean {
    return this.data.status === AlertTypes.Processing;
  }
}

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Loading Dialog Component for displaying loading state during PDF operations.
 * @component LoadingDialogComponent
 */
@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.scss'],
  imports: [MatDialogModule, MatProgressSpinnerModule, CommonModule],
  standalone: true,
})
export class LoadingDialogComponent {
  /**
   * Creates an instance of LoadingDialogComponent.
   * @param {Object} data - The dialog data containing an optional message
   * @param {string} [data.message] - The message to display in the loading dialog
   * @constructor
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message?: string }) {}
}


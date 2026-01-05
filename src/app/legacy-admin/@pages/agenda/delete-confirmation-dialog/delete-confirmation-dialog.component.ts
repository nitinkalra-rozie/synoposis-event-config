import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-delete-confirmation-dialog',
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class DeleteConfirmationDialogComponent {
  public dialogRef = inject(MatDialogRef<DeleteConfirmationDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as {
    title?: string;
    message: string;
    count: number;
    sessionTitles?: string[]; // Add session titles array
  };

  // Get session titles to display (max 20)
  public get displayedTitles(): string[] {
    if (!this.data.sessionTitles || this.data.sessionTitles.length === 0) {
      return [];
    }
    return this.data.sessionTitles.slice(0, 20);
  }

  // Check if there are more than 20 titles
  public get hasMoreTitles(): boolean {
    return this.data.sessionTitles && this.data.sessionTitles.length > 20;
  }

  // Get count of remaining titles
  public get remainingCount(): number {
    if (!this.data.sessionTitles) return 0;
    return Math.max(0, this.data.sessionTitles.length - 20);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

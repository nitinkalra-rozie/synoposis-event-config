import { CommonModule } from '@angular/common';
import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * File Upload Dialog Component for uploading PDF files.
 * @component FileUploadDialogComponent
 */
@Component({
  selector: 'app-file-upload-dialog',
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.scss'],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CommonModule,
  ],
  standalone: true,
})
export class FileUploadDialogComponent {
  @ViewChild('fileInput') public fileInput!: ElementRef<HTMLInputElement>;

  public selectedFile: File | null = null;
  public isUploading: boolean = false;
  public uploadProgress: number = 0;

  constructor(
    public dialogRef: MatDialogRef<FileUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { eventId?: string; reportType?: string }
  ) {}

  /**
   * Opens the file input dialog.
   * @returns {void}
   */
  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handles file selection.
   * @param {Event} event - The file input change event
   * @returns {void}
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        input.value = '';
        return;
      }
      // Validate file size (e.g., max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB.');
        input.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  /**
   * Handles file upload.
   * @returns {void}
   */
  onUpload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Emit the file to the parent component
    this.dialogRef.close({
      file: this.selectedFile,
      eventId: this.data.eventId,
      reportType: this.data.reportType,
    });
  }

  /**
   * Closes the dialog without uploading.
   * @returns {void}
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Removes the selected file.
   * @returns {void}
   */
  removeFile(): void {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Formats file size for display.
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}


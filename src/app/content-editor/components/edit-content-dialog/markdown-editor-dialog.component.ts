import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';

/**
 * Data passed into the dialog.
 * Feel free to extend this interface as needed.
 */
export interface MarkdownEditorData {
  initialText: string; // The initial markdown text to load into the editor.
  eventName: string;
  selected_session: string;
  selectedSessionType: string;
  selectedReportType: string;
  version: string;
}

@Component({
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  selector: 'app-markdown-editor-dialog',
  template: `
    <h1 mat-dialog-title>Edit Content</h1>
    <div mat-dialog-content>
      <mat-form-field class="full-width" appearance="fill">
        <mat-label>Edit Content</mat-label>
        <textarea
          matInput
          [(ngModel)]="markdownContent"
          (ngModelChange)="updatePreview()"
          rows="50"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button (click)="save()" color="primary">Save</button>
    </div>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .markdown-preview {
        border: 1px solid #ccc;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
        background-color: #fafafa;
      }
    `,
  ],
})
export class MarkdownEditorDialogComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MarkdownEditorData,
    private dialogRef: MatDialogRef<MarkdownEditorDialogComponent>,
    private sanitizer: DomSanitizer,
    private backendApiService: BackendApiService
  ) {}

  /** Local copy of the markdown text being edited. */
  public markdownContent: string = '';
  public isLoading: Boolean = false;
  /** Parsed and sanitized HTML preview of the current markdown content. */
  public renderedHtml: SafeHtml = '';

  ngOnInit(): void {
    if (this.data?.initialText) {
      this.markdownContent = this.data.initialText;
      this.updatePreview();
    }
  }

  /**
   * Convert the markdownContent to HTML and sanitize it for safe rendering.
   */
  async updatePreview(): Promise<void> {
    // RIGHT (rawHtml is a string)
    const rawHtml = await marked(this.markdownContent ?? '', { async: true });
    this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  /**
   * Close the dialog and pass back the updated markdown text.
   */
  save(): void {
    this.isLoading = true;
    const markdownContent = this.markdownContent.replace(/\s*\n\s*/g, '');
    this.dialogRef.close({
      edited: true,
      version: this.data.version,
      content: this.markdownContent,
    });
    const data = {
      eventId: this.data.eventName,
      sessionId: this.data.selected_session,
      sessionType: this.data.selectedSessionType,
      reportType: this.data.selectedReportType,
      version: this.data.version,
      updatedContent: JSON.parse(markdownContent),
    };
    this.backendApiService.saveEditedVersionContent(data).subscribe({
      next: (response) => {
        if (response['s3Key']) {
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }
}

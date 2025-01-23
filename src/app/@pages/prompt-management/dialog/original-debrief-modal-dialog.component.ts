import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface DialogData {
  type: string;
  transcript?: string[];
  summary?: string;
  keytakeaways?: string[];
  insights?: string[];
  topics?: string[];
}

@Component({
  selector: 'app-large-modal-dialog',
  templateUrl: './original-debrief-modal-dialog.component.html',
  styleUrls: ['./original-debrief-modal-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class LargeModalDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<LargeModalDialogComponent>,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  public sanitizedText: SafeHtml;

  ngOnInit():void {
    const rawText = this.data.transcript.join('\n\n');
    this.sanitizedText = this.sanitizeText(rawText);
  }

  sanitizeText(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  trackByFn(index: number): number {
    return index;
  }
}

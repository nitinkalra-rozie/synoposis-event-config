import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [
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

  ngOnInit(): void {
    const rawText = this.data.transcript.join('\n\n');
    this.sanitizedText = this.sanitizeText(rawText);
  }

  sanitizeText(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

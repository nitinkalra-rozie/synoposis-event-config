import { CommonModule } from '@angular/common';
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
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';

interface DialogData {
  type: string;
  transcript?: string[];
  summary?: string;
  keytakeaways?: string[];
  insights?: string[];
  topics?: string[];
  selected_session?: any;
}

@Component({
  selector: 'app-generate-realtime-insights-dialog',
  templateUrl: './generate-realtime-insights-dialog.component.html',
  styleUrls: ['./generate-realtime-insights-dialog.component.scss'],
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
export class GenerateRealtimeInsightsDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<GenerateRealtimeInsightsDialogComponent>,
    private backendApiService: BackendApiService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  public sanitizedText: SafeHtml;
  public transcriptChucks = [];

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

  trackByFn(index: number): number {
    return index;
  }

  splitIntoParagraphs(text): string[] {
    // Split text into paragraphs using two or more consecutive newlines as the separator
    let paragraphs = text.trim().split(/\n\s*\n/);
    // Remove any leading/trailing whitespace from each paragraph and filter out empty ones
    paragraphs = paragraphs.map((p) => p.trim()).filter((p) => p);
    return paragraphs;
  }

  countWords(text): number {
    // Count the number of words in a text
    const words = text.match(/\b\w+\b/g);
    return words ? words.length : 0;
  }

  splitIntoChunks(paragraphs, minWordCount = 150): string[] {
    const chunks = [];
    let currentChunkParagraphs = [];
    let currentWordCount = 0;

    for (const p of paragraphs) {
      const pWordCount = this.countWords(p);
      currentChunkParagraphs.push(p);
      currentWordCount += pWordCount;

      if (currentWordCount >= minWordCount) {
        // Combine the paragraphs into one chunk
        const chunkText = currentChunkParagraphs.join('\n\n');
        chunks.push(chunkText);
        // Reset for the next chunk
        currentChunkParagraphs = [];
        currentWordCount = 0;
      }
    }

    // Add any remaining paragraphs to the last chunk
    if (currentChunkParagraphs.length > 0) {
      const chunkText = currentChunkParagraphs.join('\n\n');
      chunks.push(chunkText);
    }

    return chunks;
  }

  processText(text, minWordCount = 100): string[] {
    const paragraphs = this.splitIntoParagraphs(text);
    const chunks = this.splitIntoChunks(paragraphs, minWordCount);
    return chunks;
  }

  splitTranscriptToChunks(): void {
    const text = this.data.transcript.join('\n\n');
    const chunks = this.processText(text);
    console.log(this.data.selected_session);
    const sessionData = this.data.selected_session;
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      this.transcriptChucks.push({
        text: chunk,
        word_count: this.countWords(chunk),
      });
      console.log(
        `Chunk ${idx + 1} (${this.countWords(chunk)} words):\n${chunk}\n`
      );
      this.backendApiService.generateRealtimeInsights({
        action: 'realTimeInsights',
        sessionId: sessionData.SessionId,
        eventName: sessionData.Event,
        domain: 'Insurance',
        day: sessionData.EventDay,
        keyNoteData: {},
        screenTimeout: 15,
        sessionTitle: sessionData.SessionTitle,
        transcript: '',
        sessionDescription: sessionData.SessionDescription,
      });

      break;
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * Audio Player Dialog Component for playing audio files in a modal.
 * @component AudioPlayerDialogComponent
 */
@Component({
  selector: 'app-audio-player-dialog',
  templateUrl: './audio-player-dialog.component.html',
  styleUrls: ['./audio-player-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  standalone: true,
})
export class AudioPlayerDialogComponent {
  /**
   * Creates an instance of AudioPlayerDialogComponent.
   * @param {MatDialogRef<AudioPlayerDialogComponent>} dialogRef - Reference to the dialog
   * @param {Object} data - The dialog data containing the audio URL
   * @param {string} data.audioUrl - The URL of the audio file to play
   * @constructor
   */
  constructor(
    public dialogRef: MatDialogRef<AudioPlayerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { audioUrl: string }
  ) {}

  /**
   * Handles audio loading errors.
   * Logs the error to the console.
   * @returns {void}
   */
  onError(): void {
    console.error('Error loading audio file:', this.data.audioUrl);
  }
}

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/**
 * Generate Track Debrief Dialog Component for selecting Tracks with checkboxes.
 * @component GenerateTrackDebriefDialogComponent
 */
@Component({
  selector: 'app-generate-track-debrief-dialog',
  templateUrl: './generate-track-debrief-dialog.component.html',
  styleUrls: ['./generate-track-debrief-dialog.component.scss'],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
  standalone: true,
})
export class GenerateTrackDebriefDialogComponent {
  public selectedTracks: string[] = [];
  public selectedTracksMap: { [key: string]: boolean } = {};
  public searchFilter: string = '';
  public filteredTracks: string[] = [];
  public tracks: string[] = [];
  /** From index for range selection */
  public fromIndex: string | null = null;
  /** To index for range selection */
  public toIndex: string | null = null;

  /**
   * Creates an instance of GenerateTrackDebriefDialogComponent.
   * @param {MatDialogRef<GenerateTrackDebriefDialogComponent>} dialogRef - Reference to the dialog
   * @param {Object} data - The dialog data containing tracks
   * @param {string[]} data.tracks - Array of available tracks
   * @constructor
   */
  constructor(
    public dialogRef: MatDialogRef<GenerateTrackDebriefDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tracks: string[] }
  ) {
    this.tracks = data.tracks || [];
    this.filteredTracks = [...this.tracks];
    // Initialize the map with all tracks set to false
    this.tracks.forEach((track) => {
      this.selectedTracksMap[track] = false;
    });
  }

  /**
   * Updates the selectedTracks array based on the checkbox map.
   * @returns {void}
   */
  updateSelectedTracks(): void {
    this.selectedTracks = this.tracks.filter(
      (track) => this.selectedTracksMap[track]
    );
  }

  /**
   * Filters tracks based on the search filter.
   * @returns {void}
   */
  filterTracks(): void {
    if (!this.searchFilter || this.searchFilter.trim() === '') {
      this.filteredTracks = [...this.tracks];
    } else {
      const filter = this.searchFilter.toLowerCase().trim();
      this.filteredTracks = this.tracks.filter((track) =>
        track.toLowerCase().includes(filter)
      );
    }
  }

  /**
   * Clears the search filter and resets the filtered tracks.
   * @returns {void}
   */
  clearSearch(): void {
    this.searchFilter = '';
    this.filteredTracks = [...this.tracks];
  }

  /**
   * Selects all visible (filtered) tracks.
   * @returns {void}
   */
  selectAll(): void {
    this.filteredTracks.forEach((track) => {
      this.selectedTracksMap[track] = true;
    });
    this.updateSelectedTracks();
  }

  /**
   * Deselects all tracks (both visible and hidden).
   * @returns {void}
   */
  deselectAll(): void {
    this.tracks.forEach((track) => {
      this.selectedTracksMap[track] = false;
    });
    this.updateSelectedTracks();
  }

  /**
   * Handles input changes for range selection inputs, removing non-numeric characters.
   * Automatically calculates 'to' as 'from + 49' when 'from' changes.
   * @param {string} field - The field being edited ('from' or 'to')
   * @param {Event} event - The input event
   * @returns {void}
   */
  onRangeInputChange(field: 'from' | 'to', event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');

    // Update the model with only numeric characters
    if (field === 'from') {
      this.fromIndex = numericValue || null;

      // Auto-calculate 'to' as 'from + 49' when 'from' changes
      if (numericValue && numericValue.trim() !== '') {
        const fromNum = parseInt(numericValue, 10);
        if (!isNaN(fromNum)) {
          const calculatedTo = (fromNum + 49).toString();
          this.toIndex = calculatedTo;
        }
      } else {
        // If 'from' is cleared, also clear 'to'
        this.toIndex = null;
      }
    } else {
      // User is manually editing 'to', so just update it
      this.toIndex = numericValue || null;
    }

    // Update the input value directly to reflect the change
    input.value = numericValue;
  }

  /**
   * Selects tracks from "from" index to "to" index in the filtered tracks list.
   * The indices are 1-based (first item is index 1).
   * @returns {void}
   */
  selectRange(): void {
    if (
      this.fromIndex === null ||
      this.toIndex === null ||
      this.fromIndex.trim() === '' ||
      this.toIndex.trim() === ''
    ) {
      return;
    }

    // Convert string inputs to numbers
    const fromNum = parseInt(this.fromIndex.trim(), 10);
    const toNum = parseInt(this.toIndex.trim(), 10);

    // Validate that inputs are valid numbers
    if (isNaN(fromNum) || isNaN(toNum) || fromNum < 1 || toNum < 1) {
      return;
    }

    if (this.filteredTracks.length === 0) {
      return;
    }

    // Convert to 0-based indices and ensure they're within bounds
    const from = Math.max(1, Math.min(fromNum, this.filteredTracks.length)) - 1;
    const to = Math.max(1, Math.min(toNum, this.filteredTracks.length)) - 1;

    // Ensure from is less than or equal to to
    const startIndex = Math.min(from, to);
    const endIndex = Math.max(from, to);

    // Select all tracks in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const track = this.filteredTracks[i];
      if (track) {
        this.selectedTracksMap[track] = true;
      }
    }

    // Update the selected tracks array
    this.updateSelectedTracks();

    // Clear the input fields after selection
    this.fromIndex = null;
    this.toIndex = null;
  }

  /**
   * Handles the generate button click.
   * Closes the dialog and returns the selected tracks array.
   * @returns {void}
   */
  onGenerate(): void {
    if (this.selectedTracks.length > 0) {
      this.dialogRef.close(this.selectedTracks);
    }
  }
}

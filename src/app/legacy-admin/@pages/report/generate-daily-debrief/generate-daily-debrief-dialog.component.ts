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
 * Generate Daily Debrief Dialog Component for selecting Event Days with checkboxes.
 * @component GenerateDailyDebriefDialogComponent
 */
@Component({
  selector: 'app-generate-daily-debrief-dialog',
  templateUrl: './generate-daily-debrief-dialog.component.html',
  styleUrls: ['./generate-daily-debrief-dialog.component.scss'],
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
export class GenerateDailyDebriefDialogComponent {
  public selectedEventDays: string[] = [];
  public selectedDaysMap: Record<string, boolean> = {};
  public searchFilter: string = '';
  public filteredDays: string[] = [];
  public eventDays: string[] = [];

  /**
   * Creates an instance of GenerateDailyDebriefDialogComponent.
   * @param {MatDialogRef<GenerateDailyDebriefDialogComponent>} dialogRef - Reference to the dialog
   * @param {Object} data - The dialog data containing event days
   * @param {string[]} data.eventDays - Array of available event days
   * @constructor
   */
  constructor(
    public dialogRef: MatDialogRef<GenerateDailyDebriefDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { eventDays: string[] }
  ) {
    this.eventDays = data.eventDays || [];
    this.filteredDays = [...this.eventDays];
    // Initialize the map with all days set to false
    this.eventDays.forEach((day) => {
      this.selectedDaysMap[day] = false;
    });
  }

  /**
   * Updates the selectedEventDays array based on the checkbox map.
   * @returns {void}
   */
  updateSelectedDays(): void {
    this.selectedEventDays = this.eventDays.filter(
      (day) => this.selectedDaysMap[day]
    );
  }

  /**
   * Filters event days based on the search filter.
   * @returns {void}
   */
  filterDays(): void {
    if (!this.searchFilter || this.searchFilter.trim() === '') {
      this.filteredDays = [...this.eventDays];
    } else {
      const filter = this.searchFilter.toLowerCase().trim();
      this.filteredDays = this.eventDays.filter((day) =>
        day.toLowerCase().includes(filter)
      );
    }
  }

  /**
   * Clears the search filter and resets the filtered days.
   * @returns {void}
   */
  clearSearch(): void {
    this.searchFilter = '';
    this.filteredDays = [...this.eventDays];
  }

  /**
   * Selects all visible (filtered) event days.
   * @returns {void}
   */
  selectAll(): void {
    this.filteredDays.forEach((day) => {
      this.selectedDaysMap[day] = true;
    });
    this.updateSelectedDays();
  }

  /**
   * Deselects all event days (both visible and hidden).
   * @returns {void}
   */
  deselectAll(): void {
    this.eventDays.forEach((day) => {
      this.selectedDaysMap[day] = false;
    });
    this.updateSelectedDays();
  }

  /**
   * Handles the generate button click.
   * Closes the dialog and returns the selected event days array.
   * @returns {void}
   */
  onGenerate(): void {
    if (this.selectedEventDays.length > 0) {
      this.dialogRef.close(this.selectedEventDays);
    }
  }
}

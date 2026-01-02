import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ColumnOption {
  key: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-column-selection-dialog',
  templateUrl: './column-selection-dialog.component.html',
  styleUrls: ['./column-selection-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    FormsModule,
  ],
})
export class ColumnSelectionDialogComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ColumnSelectionDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as {
    columns: ColumnOption[];
  };

  public columns: ColumnOption[] = [];

  ngOnInit(): void {
    // Create a copy of the columns array to avoid mutating the original
    this.columns = this.data.columns.map((col) => ({ ...col }));
    // Select all columns by default
    this.selectAll();
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onGenerate(): void {
    // Return only selected columns
    const selectedColumns = this.columns.filter((col) => col.selected);
    this.dialogRef.close(selectedColumns);
  }

  selectAll(): void {
    this.columns.forEach((col) => (col.selected = true));
  }

  deselectAll(): void {
    this.columns.forEach((col) => (col.selected = false));
  }

  public get selectedCount(): number {
    return this.columns.filter((col) => col.selected).length;
  }
}


import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  findTimeZoneByOffset,
  getUTCOffsetString,
  TIMEZONE_OPTIONS,
} from 'src/app/legacy-admin/@data-providers/timezone.data-provider';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './confirmation.dialog.component.html',
  styleUrls: ['./confirmation.dialog.component.scss'],
})
export class ConfirmationDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>) {}

  public dialogData = inject(MAT_DIALOG_DATA) as {
    title: string;
    message: string;
    warning: string;
    eventTimezone: string;
    updateEventTimezone: (timezone: string) => void;
    getTimezoneDifferenceFn: (timezone: string) => string;
    availableTimezones: { value: string; label: string }[];
  };
  public selectedTimezone: string = findTimeZoneByOffset(
    this.dialogData.eventTimezone,
    new Date(),
    this.dialogData.availableTimezones
  );
  public searchText = '';
  public timezoneDifference = '';
  public availableTimezones: { value: string; label: string }[] =
    inject(TIMEZONE_OPTIONS);

  public filteredTimezones = [...this.availableTimezones];

  filterTimezones(): void {
    const search = this.searchText.toLowerCase();
    this.filteredTimezones = this.availableTimezones.filter((tz) =>
      tz.label.toLowerCase().includes(search)
    );
  }

  updateTimezone(): void {
    this.timezoneDifference = this.dialogData.getTimezoneDifferenceFn(
      getUTCOffsetString(this.selectedTimezone)
    );
    this.dialogData.warning = `Warning: Session UTC times will be adjusted by ${this.timezoneDifference} hour from their previous values.`;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogData.updateEventTimezone(
      getUTCOffsetString(this.selectedTimezone)
    );
    this.dialogRef.close(true);
  }
}

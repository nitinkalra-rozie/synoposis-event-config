/**
 * DailyDebriefComponent
 *
 * Component for displaying and managing daily debriefs with filters and table.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DailyDebriefRow } from '../shared/report.types';

@Component({
  selector: 'app-daily-debrief',
  templateUrl: './daily-debrief.component.html',
  styleUrls: ['./daily-debrief.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
  ],
})
export class DailyDebriefComponent {
  @Input() public dataSource!: MatTableDataSource<DailyDebriefRow>;
  @Input() public displayedColumns: string[] = [];
  @Input() public selectedDailyDebriefs: Set<string> = new Set();
  @Input() public uniqueDays: string[] = [];
  @Input() public selectedEventDay: string = '';
  @Input() public selectedEvent: any = null;
  @Input() public pageSize: number = 10;

  @Output() public dailyDebriefToggle = new EventEmitter<{ eventDay: string; checked: boolean }>();
  @Output() public toggleAll = new EventEmitter<boolean>();
  @Output() public generateDailyDebrief = new EventEmitter<void>();
  @Output() public publishReport = new EventEmitter<void>();
  @Output() public eventDayFilterChange = new EventEmitter<string>();
  @Output() public editContent = new EventEmitter<DailyDebriefRow>();
  @Output() public viewPdfV2 = new EventEmitter<DailyDebriefRow>();
  @Output() public openPublishPdf = new EventEmitter<string>();
  @Output() public highlightRow = new EventEmitter<{ row: DailyDebriefRow; index: number }>();

  @ViewChild(MatSort) public sort!: MatSort;
  @ViewChild(MatPaginator) public paginator!: MatPaginator;

  public selectedRowIndex: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  isDailyDebriefSelected(eventDay: string): boolean {
    return this.selectedDailyDebriefs.has(eventDay);
  }

  isAllSelected(): boolean {
    if (!this.dataSource?.data?.length) return false;
    return this.dataSource.data.every((row) =>
      this.selectedDailyDebriefs.has(row.EventDay)
    );
  }

  isIndeterminate(): boolean {
    if (!this.dataSource?.data?.length) return false;
    const selectedCount = this.dataSource.data.filter((row) =>
      this.selectedDailyDebriefs.has(row.EventDay)
    ).length;
    return selectedCount > 0 && selectedCount < this.dataSource.data.length;
  }

  onDailyDebriefToggle(eventDay: string, checked: boolean): void {
    this.dailyDebriefToggle.emit({ eventDay, checked });
  }

  onToggleAll(checked: boolean): void {
    this.toggleAll.emit(checked);
  }

  onEventDayFilterChange(day: string): void {
    this.eventDayFilterChange.emit(day);
  }

  onEditContent(row: DailyDebriefRow): void {
    this.editContent.emit(row);
  }

  onViewPdfV2(row: DailyDebriefRow): void {
    this.viewPdfV2.emit(row);
  }

  onOpenPublishPdf(url: string): void {
    this.openPublishPdf.emit(url);
  }

  onHighlightRow(row: DailyDebriefRow, index: number): void {
    this.selectedRowIndex = index;
    this.highlightRow.emit({ row, index });
  }
}


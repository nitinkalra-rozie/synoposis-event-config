/**
 * SessionDebriefComponent
 *
 * Component for displaying and managing session debriefs with filters and table.
 */
import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
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
import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { FileFilterMode, PdfFilterMode, Session } from '../shared/report.types';

@Component({
  selector: 'app-session-debrief',
  templateUrl: './session-debrief.component.html',
  styleUrls: ['./session-debrief.component.scss'],
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
    DatePipe,
  ],
})
export class SessionDebriefComponent implements AfterViewInit {
  @Input() public dataSource!: MatTableDataSource<Session>;
  @Input() public displayedColumns: string[] = [];
  @Input() public selectedSessions: Set<string> = new Set();
  @Input() public isLoadingSessions: boolean = false;
  @Input() public uniqueDays: string[] = [];
  @Input() public fileFilterMode: FileFilterMode = 'all';
  @Input() public pdfFilterMode: PdfFilterMode = 'all';
  @Input() public selectedEventDay: string = '';
  @Input() public fromIndex: string | null = null;
  @Input() public toIndex: string | null = null;
  @Input() public pageSize: number = 10;
  @Input() public totalRecords: number = 0;

  @Output() public sessionToggle = new EventEmitter<{
    sessionId: string;
    checked: boolean;
  }>();
  @Output() public toggleAll = new EventEmitter<boolean>();
  @Output() public generatePdf = new EventEmitter<void>();
  @Output() public publishReport = new EventEmitter<void>();
  @Output() public filterChange = new EventEmitter<Event>();
  @Output() public fileFilterModeChange = new EventEmitter<FileFilterMode>();
  @Output() public pdfFilterModeChange = new EventEmitter<PdfFilterMode>();
  @Output() public eventDayFilterChange = new EventEmitter<string>();
  @Output() public rangeInputChange = new EventEmitter<{
    field: 'from' | 'to';
    event: Event;
  }>();
  @Output() public selectRange = new EventEmitter<void>();
  @Output() public editContent = new EventEmitter<Session>();
  @Output() public viewPdfV1 = new EventEmitter<Session>();
  @Output() public viewPdfV2 = new EventEmitter<Session>();
  @Output() public openPublishPdf = new EventEmitter<string>();
  @Output() public openAudioPlayer = new EventEmitter<string>();
  @Output() public highlightRow = new EventEmitter<{
    row: Session;
    index: number;
  }>();

  @ViewChild(MatSort) public sort!: MatSort;
  @ViewChild(MatPaginator) public paginator!: MatPaginator;

  protected readonly EventStatus = EventStatus;
  public selectedRowIndex: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  isSessionSelected(sessionId: string): boolean {
    return this.selectedSessions.has(sessionId);
  }

  isAllSelected(): boolean {
    if (!this.dataSource?.data?.length) return false;
    return this.dataSource.data.every((session) =>
      this.selectedSessions.has(session.SessionId)
    );
  }

  isIndeterminate(): boolean {
    if (!this.dataSource?.data?.length) return false;
    const selectedCount = this.dataSource.data.filter((session) =>
      this.selectedSessions.has(session.SessionId)
    ).length;
    return selectedCount > 0 && selectedCount < this.dataSource.data.length;
  }

  onSessionToggle(sessionId: string, checked: boolean): void {
    this.sessionToggle.emit({ sessionId, checked });
  }

  onToggleAll(checked: boolean): void {
    this.toggleAll.emit(checked);
  }

  onFilterChange(event: Event): void {
    this.filterChange.emit(event);
  }

  onFileFilterModeChange(mode: FileFilterMode): void {
    this.fileFilterModeChange.emit(mode);
  }

  onPdfFilterModeChange(mode: PdfFilterMode): void {
    this.pdfFilterModeChange.emit(mode);
  }

  onEventDayFilterChange(day: string): void {
    this.eventDayFilterChange.emit(day);
  }

  onRangeInputChange(field: 'from' | 'to', event: Event): void {
    this.rangeInputChange.emit({ field, event });
  }

  onSelectRange(): void {
    this.selectRange.emit();
  }

  ngAfterViewInit(): void {
    if (this.dataSource && this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  onEditContent(row: Session): void {
    this.editContent.emit(row);
  }

  onViewPdfV1(row: Session): void {
    this.viewPdfV1.emit(row);
  }

  onViewPdfV2(row: Session): void {
    this.viewPdfV2.emit(row);
  }

  onOpenPublishPdf(url: string): void {
    this.openPublishPdf.emit(url);
  }

  onOpenAudioPlayer(url: string): void {
    this.openAudioPlayer.emit(url);
  }

  onHighlightRow(row: Session, index: number): void {
    this.selectedRowIndex = index;
    this.highlightRow.emit({ row, index });
  }
}

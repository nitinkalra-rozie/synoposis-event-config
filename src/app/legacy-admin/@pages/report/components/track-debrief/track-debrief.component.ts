/**
 * TrackDebriefComponent
 *
 * Component for displaying and managing track debriefs with filters and table.
 */
import { CommonModule } from '@angular/common';
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
import {
  TrackDebriefPdfFilterMode,
  TrackDebriefPublishFilterMode,
  TrackDebriefRow,
} from '../shared/report.types';

@Component({
  selector: 'app-track-debrief',
  templateUrl: './track-debrief.component.html',
  styleUrls: ['./track-debrief.component.scss'],
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
export class TrackDebriefComponent implements AfterViewInit {
  @Input() public dataSource!: MatTableDataSource<TrackDebriefRow>;
  @Input() public displayedColumns: string[] = [];
  @Input() public selectedTrackDebriefs: Set<string> = new Set();
  @Input() public selectedEvent: any = null;
  @Input() public uniqueTracks: string[] = [];
  @Input() public trackSearchFilter: string = '';
  @Input() public trackDebriefPublishFilterMode: TrackDebriefPublishFilterMode = 'all';
  @Input() public trackDebriefPdfFilterMode: TrackDebriefPdfFilterMode = 'all';
  @Input() public fromTrackIndex: string | null = null;
  @Input() public toTrackIndex: string | null = null;
  @Input() public pageSize: number = 10;

  @Output() public trackDebriefToggle = new EventEmitter<{ track: string; checked: boolean }>();
  @Output() public toggleAll = new EventEmitter<boolean>();
  @Output() public generateTrackDebrief = new EventEmitter<void>();
  @Output() public publishReport = new EventEmitter<void>();
  @Output() public searchFilterChange = new EventEmitter<Event>();
  @Output() public publishFilterModeChange = new EventEmitter<TrackDebriefPublishFilterMode>();
  @Output() public pdfFilterModeChange = new EventEmitter<TrackDebriefPdfFilterMode>();
  @Output() public rangeInputChange = new EventEmitter<{ field: 'from' | 'to'; event: Event }>();
  @Output() public selectRange = new EventEmitter<void>();
  @Output() public editContent = new EventEmitter<TrackDebriefRow>();
  @Output() public viewPdfV2 = new EventEmitter<TrackDebriefRow>();
  @Output() public openPublishPdf = new EventEmitter<string>();
  @Output() public highlightRow = new EventEmitter<{ row: TrackDebriefRow; index: number }>();

  @ViewChild(MatSort) public sort!: MatSort;
  @ViewChild(MatPaginator) public paginator!: MatPaginator;

  public selectedRowIndex: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (this.dataSource && this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  isTrackDebriefSelected(track: string): boolean {
    return this.selectedTrackDebriefs.has(track);
  }

  isAllSelected(): boolean {
    if (!this.dataSource?.data?.length) return false;
    return this.dataSource.data.every((row) =>
      this.selectedTrackDebriefs.has(row.Track)
    );
  }

  isIndeterminate(): boolean {
    if (!this.dataSource?.data?.length) return false;
    const selectedCount = this.dataSource.data.filter((row) =>
      this.selectedTrackDebriefs.has(row.Track)
    ).length;
    return selectedCount > 0 && selectedCount < this.dataSource.data.length;
  }

  onTrackDebriefToggle(track: string, checked: boolean): void {
    this.trackDebriefToggle.emit({ track, checked });
  }

  onToggleAll(checked: boolean): void {
    this.toggleAll.emit(checked);
  }

  onSearchFilterChange(event: Event): void {
    this.searchFilterChange.emit(event);
  }

  onPublishFilterModeChange(mode: TrackDebriefPublishFilterMode): void {
    this.publishFilterModeChange.emit(mode);
  }

  onPdfFilterModeChange(mode: TrackDebriefPdfFilterMode): void {
    this.pdfFilterModeChange.emit(mode);
  }

  onRangeInputChange(field: 'from' | 'to', event: Event): void {
    this.rangeInputChange.emit({ field, event });
  }

  onSelectRange(): void {
    this.selectRange.emit();
  }

  onEditContent(row: TrackDebriefRow): void {
    this.editContent.emit(row);
  }

  onViewPdfV2(row: TrackDebriefRow): void {
    this.viewPdfV2.emit(row);
  }

  onOpenPublishPdf(url: string): void {
    this.openPublishPdf.emit(url);
  }

  onHighlightRow(row: TrackDebriefRow, index: number): void {
    this.selectedRowIndex = index;
    this.highlightRow.emit({ row, index });
  }
}


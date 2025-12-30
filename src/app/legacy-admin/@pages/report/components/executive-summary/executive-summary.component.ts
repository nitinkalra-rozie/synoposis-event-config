/**
 * ExecutiveSummaryComponent
 *
 * Component for displaying and managing executive summaries with table.
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileUploadDialogComponent } from '../file-upload-dialog/file-upload-dialog.component';
import { ExecutiveSummaryRow } from '../shared/report.types';

@Component({
  selector: 'app-executive-summary',
  templateUrl: './executive-summary.component.html',
  styleUrls: ['./executive-summary.component.scss'],
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
    MatDialogModule,
  ],
})
export class ExecutiveSummaryComponent implements AfterViewInit {
  @Input() public dataSource!: MatTableDataSource<ExecutiveSummaryRow>;
  @Input() public displayedColumns: string[] = [];
  @Input() public selectedExecutiveSummaries: Set<string> = new Set();
  @Input() public selectedEvent: any = null;
  @Input() public uniqueDays: string[] = [];
  @Input() public pageSize: number = 10;

  @Output() public executiveSummaryToggle = new EventEmitter<{
    executiveSummaryId: string;
    checked: boolean;
  }>();
  @Output() public toggleAll = new EventEmitter<boolean>();
  @Output() public generateExecutiveSummary = new EventEmitter<void>();
  @Output() public publishReport = new EventEmitter<void>();
  @Output() public uploadManualPublishReport = new EventEmitter<{
    file: File;
    eventId?: string;
  }>();
  @Output() public editContent = new EventEmitter<ExecutiveSummaryRow>();
  @Output() public viewPdfV2 = new EventEmitter<ExecutiveSummaryRow>();
  @Output() public openPublishPdf = new EventEmitter<string>();
  @Output() public highlightRow = new EventEmitter<{
    row: ExecutiveSummaryRow;
    index: number;
  }>();

  @ViewChild(MatSort) public sort!: MatSort;
  @ViewChild(MatPaginator) public paginator!: MatPaginator;

  public selectedRowIndex: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngAfterViewInit(): void {
    if (this.dataSource && this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  isExecutiveSummarySelected(executiveSummaryId: string): boolean {
    return this.selectedExecutiveSummaries.has(executiveSummaryId);
  }

  isAllSelected(): boolean {
    if (!this.dataSource?.data?.length) return false;
    return this.dataSource.data.every((row) =>
      this.selectedExecutiveSummaries.has(row.executiveSummaryId)
    );
  }

  isIndeterminate(): boolean {
    if (!this.dataSource?.data?.length) return false;
    const selectedCount = this.dataSource.data.filter((row) =>
      this.selectedExecutiveSummaries.has(row.executiveSummaryId)
    ).length;
    return selectedCount > 0 && selectedCount < this.dataSource.data.length;
  }

  /**
   * Gets whether the executive summary listing is empty.
   * @returns {boolean} True if the listing is empty, false otherwise
   */
  public get isListingEmpty(): boolean {
    // Check if dataSource exists and has data
    if (!this.dataSource) {
      return true;
    }

    // Check the actual data array - MatTableDataSource always has a data property
    const data = this.dataSource.data;

    // Return true if data is null, undefined, or empty array
    // Note: MatTableDataSource initializes with empty array [], so we check length
    return !data || !Array.isArray(data) || data.length === 0;
  }

  /**
   * Checks if there's at least one executive summary with PDF V2 available.
   * @returns {boolean} True if at least one item has PDF V2, false otherwise
   */
  hasAnyWithPdfV2(): boolean {
    if (!this.dataSource) {
      return false;
    }

    const data = this.dataSource.filteredData || this.dataSource.data || [];

    if (data.length === 0) {
      return false;
    }

    // Check if at least one row has PDF V2
    return data.some((row: ExecutiveSummaryRow) => {
      const hasPdfV2 =
        row.pdfPathV2 &&
        (typeof row.pdfPathV2 === 'string'
          ? row.pdfPathV2.trim().length > 0
          : row.pdfPathV2);
      return hasPdfV2 && row.version;
    });
  }

  onExecutiveSummaryToggle(executiveSummaryId: string, checked: boolean): void {
    this.executiveSummaryToggle.emit({ executiveSummaryId, checked });
  }

  onToggleAll(checked: boolean): void {
    this.toggleAll.emit(checked);
  }

  onEditContent(row: ExecutiveSummaryRow): void {
    this.editContent.emit(row);
  }

  onViewPdfV2(row: ExecutiveSummaryRow): void {
    this.viewPdfV2.emit(row);
  }

  onOpenPublishPdf(url: string): void {
    this.openPublishPdf.emit(url);
  }

  onHighlightRow(row: ExecutiveSummaryRow, index: number): void {
    this.selectedRowIndex = index;
    this.highlightRow.emit({ row, index });
  }

  /**
   * Opens the file upload dialog for manual publish report upload.
   * @returns {void}
   */
  onUploadManualPublishReport(): void {
    // Handle both string (EventIdentifier) and object (EventConfig) types
    const eventId =
      typeof this.selectedEvent === 'string'
        ? this.selectedEvent
        : this.selectedEvent?.EventIdentifier;

    if (!eventId) {
      // Emit error event or show error - for now, we'll let parent handle it
      this.uploadManualPublishReport.emit({
        file: null as any,
        eventId: undefined,
      });
      return;
    }

    const dialogRef = this.dialog.open(FileUploadDialogComponent, {
      width: '600px',
      data: {
        eventId: eventId,
        reportType: 'executive_summary',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.file) {
        this.uploadManualPublishReport.emit({
          file: result.file,
          eventId: result.eventId || eventId,
        });
      }
    });
  }
}

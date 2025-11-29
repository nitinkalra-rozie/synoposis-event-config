/**
 * ReportComponent
 *
 * This component displays a report section where users can select an event from a dropdown
 * and then view sessions with checkbox options for that event.
 *
 * Main responsibilities:
 *  - Display events in a dropdown
 *  - Fetch and display sessions for selected event
 *  - Allow selection of sessions via checkboxes
 *  - View and publish PDF reports for sessions
 *  - Manage session content versions and PDF paths
 *
 * @component ReportComponent
 * @implements {OnInit, AfterViewInit}
 */
import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { Session } from '../event-configuration/event-configuration.component';

/**
 * Interface representing an event configuration.
 * @interface EventConfig
 * @property {string} EventIdentifier - The unique identifier for the event
 * @property {string} Domain - The domain associated with the event
 * @property {any} [key: string] - Additional properties that may be present
 */
interface EventConfig {
  /** The unique identifier for the event */
  EventIdentifier: string;
  /** The domain associated with the event */
  Domain: string;
  /** Additional properties that may be present */
  [key: string]: any;
}

/**
 * Loading Dialog Component for displaying loading state during PDF operations.
 * @component LoadingDialogComponent
 */
@Component({
  selector: 'app-loading-dialog',
  template: `
    <div style="text-align: center; padding: 2rem;">
      <h2>{{ data.message || 'Loading...' }}</h2>
      <div style="display:flex;justify-content: center;">
        <mat-spinner [diameter]="32" [strokeWidth]="3"></mat-spinner>
        <div></div>
      </div>
    </div>
  `,
  imports: [MatDialogModule, MatProgressSpinnerModule, CommonModule],
  standalone: true,
})
export class LoadingDialogComponent {
  /**
   * Creates an instance of LoadingDialogComponent.
   * @param {Object} data - The dialog data containing an optional message
   * @param {string} [data.message] - The message to display in the loading dialog
   * @constructor
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: { message?: string }) {}
}

/**
 * Audio Player Dialog Component for playing audio files in a modal.
 * @component AudioPlayerDialogComponent
 */
@Component({
  selector: 'app-audio-player-dialog',
  template: `
    <div class="audio-dialog-container">
      <div class="audio-dialog-header">
        <h2 mat-dialog-title>Audio Player</h2>
        <button mat-dialog-close mat-icon-button class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <mat-dialog-content class="audio-dialog-content">
        <audio
          [src]="data.audioUrl"
          (error)="onError()"
          controls
          style="width: 100%;">
          Your browser does not support the audio element.
        </audio>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .audio-dialog-container {
        min-width: 500px;
        max-width: 800px;
      }
      .audio-dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }
      .audio-dialog-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
      .close-button {
        margin-left: auto;
      }
      .audio-dialog-content {
        padding: 24px;
        min-height: 100px;
      }
      @media (max-width: 600px) {
        .audio-dialog-container {
          min-width: 90vw;
        }
      }
    `,
  ],
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

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    TopBarComponent,
    DatePipe,
  ],
  providers: [],
})
export class ReportComponent implements OnInit, AfterViewInit {
  /**
   * Creates an instance of ReportComponent.
   * @param {DomSanitizer} sanitizer - Service for sanitizing HTML content
   * @param {MatSnackBar} snackBar - Service for displaying snack bar notifications
   * @param {MatIconRegistry} matIconRegistry - Registry for Material icons
   * @param {DomSanitizer} domSanitizer - Service for sanitizing DOM content
   * @param {ChangeDetectorRef} cdr - Service for manual change detection
   * @param {MatDialog} dialog - Service for opening Material dialogs
   */
  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    console.log('ReportComponent loaded');
    this.matIconRegistry.addSvgIconSet(
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/mdi.svg')
    );
  }

  /** Material paginator for the sessions table */
  @ViewChild(MatPaginator) public paginator!: MatPaginator;
  /** Material sort for the sessions table */
  @ViewChild(MatSort) public sort!: MatSort;

  /** Breadcrumb items for navigation */
  public breadCrumbItems!: Array<{}>;
  /** Flag indicating if events are currently being loaded */
  public isLoading: boolean = false;
  /** Flag indicating if sessions are currently being loaded */
  public isLoadingSessions: boolean = false;
  /** Array of available events */
  public events: EventConfig[] = [];
  /** Filtered events for autocomplete */
  public filteredEvents: EventConfig[] = [];
  /** The currently selected event identifier */
  public selectedEvent: string = '';
  /** Event search input control */
  public eventSearchInput: string = '';
  /** Array of sessions for the selected event */
  public sessions: Session[] = [];
  /** Set of selected session IDs */
  public selectedSessions: Set<string> = new Set();
  /** Array of content versions for the selected event */
  public contentVersions: any[] = [];
  /** Event report details containing published report URLs */
  public eventReportDetails: any = null;
  /** Number of items per page in the paginator */
  public pageSize = 10;
  /** Total number of records in the table */
  public totalRecords = 0;
  /** Index of the currently selected/highlighted row */
  public selectedRowIndex: number | null = null;
  /** Current text filter value */
  public textFilterValue: string = '';
  /** Filter mode for publishPdf and audio file: 'all' | 'publishPdfOnly' | 'audioFileOnly' | 'both' | 'either' | 'neither' */
  public fileFilterMode:
    | 'all'
    | 'publishPdfOnly'
    | 'audioFileOnly'
    | 'both'
    | 'either'
    | 'neither' = 'all';

  /** Column definitions for the Material table */
  public displayedColumns: string[] = [
    'select',
    'startDate',
    'startTime',
    'endTime',
    'title',
    'sessionid',
    'status',
    'track',
    'Type',
    'pdfPathV1',
    'pdfPathV2',
    'version',
    'publishPdf',
    'audioFile',
  ];

  /** Material table data source for sessions */
  public dataSource = new MatTableDataSource<Session>([]);

  /** EventStatus enum reference for template usage */
  protected readonly EventStatus = EventStatus;

  /** Backend API service for fetching data */
  private _backendApiService = inject(BackendApiService);
  /** Legacy backend API service for fetching event configurations */
  private _legacyBackendApiService = inject(LegacyBackendApiService);

  /**
   * Angular lifecycle hook that is called after data-bound properties are initialized.
   * Sets up breadcrumb items and fetches events.
   * @returns {void}
   */
  ngOnInit(): void {
    // BreadCrumb Set
    this.breadCrumbItems = [
      { label: 'Elsa Events' },
      { label: 'Report', active: true },
    ];
    this.isLoading = true;
    this.getEvents();
  }

  /**
   * Angular lifecycle hook that is called after the component's view has been initialized.
   * Sets up sorting and pagination for the table.
   * @returns {void}
   */
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    // Set up custom filter predicate
    this.setFilterPredicate();
  }

  /**
   * Sets up the custom filter predicate for the data source.
   * This predicate handles text search and file filter mode (publishPdf/audio file).
   * @private
   * @returns {void}
   */
  private setFilterPredicate(): void {
    this.dataSource.filterPredicate = (
      data: Session & { reportUrl?: string; audioSegmentUrl?: string },
      filter: string
    ) => {
      // Text filter
      const textMatch =
        !this.textFilterValue ||
        Object.values(data).some(
          (value) =>
            value &&
            value
              .toString()
              .toLowerCase()
              .includes(this.textFilterValue.toLowerCase())
        );

      // File filter mode
      let fileFilterMatch = true;
      // Check for both existence and non-empty string values
      // Handle both string and non-string values (e.g., URLs as strings)
      const hasPublishPdf = !!(
        data.reportUrl &&
        (typeof data.reportUrl === 'string'
          ? data.reportUrl.trim().length > 0
          : data.reportUrl)
      );
      const hasAudioFile = !!(
        data.audioSegmentUrl &&
        (typeof data.audioSegmentUrl === 'string'
          ? data.audioSegmentUrl.trim().length > 0
          : data.audioSegmentUrl)
      );

      switch (this.fileFilterMode) {
        case 'publishPdfOnly':
          fileFilterMatch = hasPublishPdf && !hasAudioFile;
          break;
        case 'audioFileOnly':
          fileFilterMatch = hasAudioFile && !hasPublishPdf;
          break;
        case 'both':
          fileFilterMatch = hasPublishPdf && hasAudioFile;
          break;
        case 'either':
          fileFilterMatch = hasPublishPdf || hasAudioFile;
          break;
        case 'neither':
          fileFilterMatch = !hasPublishPdf && !hasAudioFile;
          break;
        case 'all':
        default:
          fileFilterMatch = true;
          break;
      }

      return textMatch && fileFilterMatch;
    };
  }

  /**
   * Fetches all available events from the backend.
   * Updates the events array and handles loading states.
   * @returns {void}
   */
  public getEvents = (): void => {
    this.isLoading = true;
    this._legacyBackendApiService._getEventConfigs().subscribe({
      next: (response: any) => {
        const data = response.data || [];
        if (data.length > 0) {
          this.events = data;
          this.filteredEvents = data;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        this.displayErrorMessage('Failed to load events. Please try again.');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  };

  /**
   * Fetches event report details for a specific event.
   * This includes published report URLs for sessions.
   * @param {string} eventIdentifier - The identifier of the event
   * @returns {void}
   */
  public getEventReportDetailsForEvent(eventIdentifier: string): void {
    this._backendApiService
      .getEventReportDetails(eventIdentifier, '')
      .subscribe({
        next: (response: any) => {
          console.log('Event report details:', response);
          this.eventReportDetails = response;
          // Map reportUrl to sessions if sessions are already loaded
          if (this.sessions && this.sessions.length > 0) {
            this.mapReportUrlsToSessions();
          }
        },
        error: (error) => {
          console.error('Error fetching event report details:', error);
          this.eventReportDetails = null;
          // Optionally show error message or handle silently
        },
      });
  }

  /**
   * Handles the event selection change from the dropdown.
   * Clears previous selections and fetches sessions for the new event.
   * @param {string} eventIdentifier - The identifier of the selected event
   * @returns {void}
   */
  public onEventChange(eventIdentifier: string): void {
    if (!eventIdentifier) {
      this.sessions = [];
      this.dataSource = new MatTableDataSource([]);
      this.setFilterPredicate();
      this.selectedSessions.clear();
      // Reset filters
      this.textFilterValue = '';
      this.fileFilterMode = 'all';
      // Reset event search input
      this.eventSearchInput = '';
      this.filteredEvents = this.events;
      return;
    }

    this.selectedEvent = eventIdentifier;
    this.isLoadingSessions = true;
    this.selectedSessions.clear();
    // Reset filters
    this.textFilterValue = '';
    this.fileFilterMode = 'all';

    this.getSessionsForEvent(eventIdentifier);
  }

  /**
   * Highlights a row in the table when clicked.
   * @param {Session} row - The session row that was clicked
   * @param {number} index - The index of the row in the table
   * @returns {void}
   */
  public highlightRow(row: Session, index: number): void {
    this.selectedRowIndex = index;
  }

  /**
   * Applies a filter to the sessions table based on the search input.
   * @param {Event} event - The keyboard event from the search input
   * @returns {void}
   */
  public applyFilter(event: Event): void {
    this.textFilterValue = (event.target as HTMLInputElement).value.trim();
    this.applyAllFilters();
  }

  /**
   * Applies all active filters (text and file filter mode) to the table.
   * @returns {void}
   */
  public applyAllFilters(): void {
    // Trigger filter by setting a non-empty string (the actual filtering is done in filterPredicate)
    this.dataSource.filter = 'active';
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginator.firstPage();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handles the file filter mode change.
   * @param {string} mode - The filter mode: 'all' | 'publishPdfOnly' | 'audioFileOnly' | 'both' | 'either' | 'neither'
   * @returns {void}
   */
  public onFileFilterModeChange(mode: string): void {
    this.fileFilterMode = mode as
      | 'all'
      | 'publishPdfOnly'
      | 'audioFileOnly'
      | 'both'
      | 'either'
      | 'neither';
    this.applyAllFilters();
  }

  /**
   * Gets the currently filtered/visible sessions from the data source.
   * @returns {Session[]} Array of filtered sessions
   */
  public getFilteredSessions(): Session[] {
    return this.dataSource.filteredData || this.dataSource.data || [];
  }

  /**
   * Gets the count of selected sessions that are currently visible (filtered).
   * @returns {number} Count of selected visible sessions
   */
  public getSelectedFilteredCount(): number {
    const filteredSessions = this.getFilteredSessions();
    return filteredSessions.filter((session) =>
      this.selectedSessions.has(session.SessionId)
    ).length;
  }

  /**
   * Toggles the selection state of all filtered/visible sessions.
   * @param {boolean} checked - Whether to select or deselect all filtered sessions
   * @returns {void}
   */
  public toggleAllSessions(checked: boolean): void {
    const filteredSessions = this.getFilteredSessions();
    if (checked) {
      filteredSessions.forEach((session) => {
        this.selectedSessions.add(session.SessionId);
      });
    } else {
      // Only deselect the filtered sessions
      filteredSessions.forEach((session) => {
        this.selectedSessions.delete(session.SessionId);
      });
    }
  }

  /**
   * Checks if all filtered/visible sessions are currently selected.
   * @returns {boolean} True if all filtered sessions are selected, false otherwise
   */
  public isAllSelected(): boolean {
    const filteredSessions = this.getFilteredSessions();
    return (
      filteredSessions.length > 0 &&
      filteredSessions.every((session) =>
        this.selectedSessions.has(session.SessionId)
      )
    );
  }

  /**
   * Checks if the select-all checkbox should be in an indeterminate state.
   * This occurs when some but not all filtered sessions are selected.
   * @returns {boolean} True if some filtered sessions are selected, false otherwise
   */
  public isIndeterminate(): boolean {
    const filteredSessions = this.getFilteredSessions();
    const selectedFilteredCount = this.getSelectedFilteredCount();
    return (
      selectedFilteredCount > 0 &&
      selectedFilteredCount < filteredSessions.length
    );
  }

  /**
   * Returns the CSS class name for a given session status.
   * @param {string} status - The status of the session
   * @returns {string} The CSS class name for the status
   */
  public getStatusClass(status: string): string {
    switch (status) {
      case EventStatus.NotStarted:
        return 'status-not-started';
      case EventStatus.UnderReview:
        return 'status-in-review';
      case EventStatus.Completed:
        return 'status-completed';
      case EventStatus.ReviewComplete:
        return 'status-completed';
      case EventStatus.ProcessingInsights:
        return 'status-processing-insights';
      default:
        return '';
    }
  }

  /**
   * Fetches sessions for a specific event.
   * Filters sessions to show only those with UnderReview or ReviewComplete status.
   * Also fetches content versions and report details in parallel.
   * Only displays the listing after all 3 APIs complete.
   * @param {string} eventIdentifier - The identifier of the event
   */
  public getSessionsForEvent(eventIdentifier: string): void {
    this.isLoadingSessions = true;

    // Call all 3 APIs in parallel using forkJoin
    const sessionsObservable = this._backendApiService
      .getSessionsForEvent(eventIdentifier)
      .pipe(
        catchError((error) => {
          console.error('Error fetching sessions:', error);
          return of({ data: null, error: 'Failed to load sessions' });
        })
      );

    const contentVersionsObservable = this._backendApiService
      .getContentVersionsByEventId(eventIdentifier)
      .pipe(
        catchError((error) => {
          console.error('Error fetching content versions:', error);
          return of({ versions: [], error: 'Failed to load content versions' });
        })
      );

    const eventReportDetailsObservable = this._backendApiService
      .getEventReportDetails(eventIdentifier, '')
      .pipe(
        catchError((error) => {
          console.error('Error fetching event report details:', error);
          return of({
            data: null,
            error: 'Failed to load event report details',
          });
        })
      );

    // Wait for all 3 APIs to complete
    forkJoin({
      sessions: sessionsObservable,
      contentVersions: contentVersionsObservable,
      eventReportDetails: eventReportDetailsObservable,
    }).subscribe({
      next: (responses) => {
        // Process sessions response
        const sessionsResponse = responses.sessions as any;
        const data =
          sessionsResponse?.data?.eventDetails ||
          sessionsResponse?.data ||
          sessionsResponse?.eventDetails ||
          [];
        const allSessions = Array.isArray(data) ? data : [];

        // Filter sessions to show only those with UnderReview or ReviewComplete status
        this.sessions = allSessions.filter(
          (session: Session) =>
            session.Status === EventStatus.UnderReview ||
            session.Status === EventStatus.ReviewComplete
        );

        // Process content versions response
        const contentVersionsResponse = responses.contentVersions as any;
        this.contentVersions = contentVersionsResponse?.versions || [];
        console.log('Content versions for event:', this.contentVersions);
        console.log(
          `Found ${this.contentVersions.length} content version(s) for event ${eventIdentifier}`
        );

        // Process event report details response
        const eventReportDetailsResponse = responses.eventReportDetails as any;
        // Use the response as-is (matching original behavior)
        this.eventReportDetails = eventReportDetailsResponse || null;
        console.log('Event report details:', this.eventReportDetails);

        // Only display listing if we have sessions
        if (this.sessions && this.sessions.length > 0) {
          // Map report URLs to sessions (without updating data source yet)
          this.mapReportUrlsToSessions(false);

          // Enrich sessions with PDF paths (this will update data source at the end)
          this.enrichSessionsWithPdfPaths();
        } else {
          // No sessions found, initialize empty data source
          this.dataSource = new MatTableDataSource([]);
          this.setFilterPredicate();
          this.totalRecords = 0;
        }

        this.isLoadingSessions = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error in forkJoin:', error);
        this.displayErrorMessage('Failed to load data. Please try again.');
        this.sessions = [];
        this.dataSource = new MatTableDataSource([]);
        this.setFilterPredicate();
        this.isLoadingSessions = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Fetches content versions for a specific event.
   * Content versions contain PDF paths for different prompt versions.
   * @param {string} eventIdentifier - The identifier of the event
   * @param {string} [reportType] - Optional report type filter (defaults to 'session_debrief')
   * @returns {void}
   */
  public getContentVersionsByEventId(
    eventIdentifier: string,
    reportType?: string
  ): void {
    this._backendApiService
      .getContentVersionsByEventId(eventIdentifier, reportType)
      .subscribe({
        next: (response: any) => {
          this.contentVersions = response.versions || [];
          console.log('Content versions for event:', this.contentVersions);
          console.log(
            `Found ${this.contentVersions.length} content version(s) for event ${eventIdentifier}`
          );
          // Enrich sessions with PDF paths after content versions are loaded
          this.enrichSessionsWithPdfPaths();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching content versions:', error);
          this.displayErrorMessage(
            'Failed to load content versions. Please try again.'
          );
          this.contentVersions = [];
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Normalizes session type strings to match the format used in contentVersions.
   * Converts various session type formats to a standardized lowercase format.
   * @private
   * @param {string} sessionType - The session type to normalize
   * @returns {string} The normalized session type
   */
  private normalizeSessionType(sessionType: string): string {
    // Convert Session.Type values to lowercase format used in contentVersions
    const typeMap: { [key: string]: string } = {
      PrimarySession: 'primary',
      BreakoutSession: 'breakout',
      primary: 'primary',
      breakout: 'breakout',
      keynote: 'keynote',
      panel_discussion: 'panel_discussion',
      talk: 'talk',
      fireside_chat: 'fireside_chat',
      closing: 'closing',
      presentation: 'presentation',
      welcome: 'welcome',
    };
    return typeMap[sessionType] || sessionType.toLowerCase();
  }

  /**
   * Gets the latest PDF paths (V1 and V2) for a specific session.
   * @param {string} sessionId - The identifier of the session
   * @param {string} sessionType - The type of the session
   * @param {string} [reportType='session_debrief'] - The type of report
   * @returns {Object|null} An object containing pdfPathV1, pdfPathV2, and version, or null if not found
   * @returns {string} return.pdfPathV1 - The path to PDF version 1
   * @returns {string} return.pdfPathV2 - The path to PDF version 2
   * @returns {number} return.version - The version number
   */
  public getLatestPdfPathsForSession(
    sessionId: string,
    sessionType: string,
    reportType: string = 'session_debrief'
  ): { pdfPathV1: string; pdfPathV2: string; version: number } | null {
    if (!this.contentVersions || this.contentVersions.length === 0) {
      return null;
    }

    // Normalize session type to match contentVersions format
    const normalizedSessionType = this.normalizeSessionType(sessionType);

    // Filter versions by sessionId, sessionType, and reportType
    const matchingVersions = this.contentVersions.filter(
      (version: any) =>
        version.sessionId === sessionId &&
        version.sessionType === normalizedSessionType &&
        version.reportType === reportType
    );

    if (matchingVersions.length === 0) {
      return null;
    }

    // Sort by version number (descending) to get the latest version
    const sortedVersions = matchingVersions.sort((a: any, b: any) => {
      const versionA = a.version || 0;
      const versionB = b.version || 0;
      return versionB - versionA;
    });

    const latestVersion = sortedVersions[0];
    return {
      pdfPathV1: latestVersion.pdfPathV1 || '',
      pdfPathV2: latestVersion.pdfPathV2 || '',
      version: latestVersion.version || 0,
    };
  }

  /**
   * Maps published report URLs from eventReportDetails to their corresponding sessions.
   * Updates the sessions array with reportUrl properties.
   * @param {boolean} [updateDataSource=true] - Whether to update the data source immediately
   * @returns {void}
   */
  public mapReportUrlsToSessions(updateDataSource: boolean = true): void {
    if (!this.sessions || this.sessions.length === 0) {
      return;
    }

    if (
      !this.eventReportDetails ||
      !this.eventReportDetails.data ||
      !this.eventReportDetails.data.sessions
    ) {
      return;
    }

    // Create a map of SessionId to ReportUrl and AudioSegmentUrl from eventReportDetails
    const reportUrlMap = new Map<string, string>();
    const audioSegmentUrlMap = new Map<string, string>();
    this.eventReportDetails.data.sessions.forEach((sessionReport: any) => {
      if (sessionReport.SessionId) {
        if (sessionReport.ReportUrl) {
          reportUrlMap.set(sessionReport.SessionId, sessionReport.ReportUrl);
        }
        if (sessionReport.AudioSummaryUrl) {
          audioSegmentUrlMap.set(
            sessionReport.SessionId,
            sessionReport.AudioSummaryUrl
          );
        }
      }
    });

    // Map reportUrl and audioSegmentUrl to sessions
    this.sessions = this.sessions.map(
      (session: Session & { reportUrl?: string; audioSegmentUrl?: string }) => {
        const reportUrl = reportUrlMap.get(session.SessionId);
        const audioSegmentUrl = audioSegmentUrlMap.get(session.SessionId);
        if (reportUrl) {
          session.reportUrl = reportUrl;
        } else {
          session.reportUrl = undefined;
        }
        if (audioSegmentUrl) {
          session.audioSegmentUrl = audioSegmentUrl;
        } else {
          session.audioSegmentUrl = undefined;
        }
        return session;
      }
    );

    // Update the data source only if requested
    if (updateDataSource) {
      this.dataSource = new MatTableDataSource(this.sessions);
      // Set filter predicate again (lost when creating new data source)
      this.setFilterPredicate();
      this.totalRecords = this.sessions.length;
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        // Reapply filters after data source update
        this.applyAllFilters();
      }, 100);
    }
  }

  /**
   * Enriches sessions with PDF paths from contentVersions.
   * Preserves existing reportUrl properties while adding PDF path information.
   * @returns {void}
   */
  public enrichSessionsWithPdfPaths(): void {
    if (!this.sessions || this.sessions.length === 0) {
      return;
    }

    if (!this.contentVersions || this.contentVersions.length === 0) {
      return;
    }

    // Enrich each session with PDF paths (preserve reportUrl and audioSegmentUrl if they exist)
    this.sessions = this.sessions.map(
      (
        session: Session & {
          pdfPathV1?: string;
          pdfPathV2?: string;
          pdfVersion?: number;
          reportUrl?: string;
          audioSegmentUrl?: string;
        }
      ) => {
        const existingReportUrl = session.reportUrl; // Preserve reportUrl
        const existingAudioSegmentUrl = session.audioSegmentUrl; // Preserve audioSegmentUrl
        const pdfPaths = this.getLatestPdfPathsForSession(
          session.SessionId,
          session.Type || 'primary',
          'session_debrief'
        );

        if (pdfPaths) {
          session.pdfPathV1 = pdfPaths.pdfPathV1;
          session.pdfPathV2 = pdfPaths.pdfPathV2;
          session.pdfVersion = pdfPaths.version;
        } else {
          // Clear PDF paths if no version found
          session.pdfPathV1 = undefined;
          session.pdfPathV2 = undefined;
          session.pdfVersion = undefined;
        }

        // Restore reportUrl if it existed
        if (existingReportUrl) {
          session.reportUrl = existingReportUrl;
        }

        // Restore audioSegmentUrl if it existed
        if (existingAudioSegmentUrl) {
          session.audioSegmentUrl = existingAudioSegmentUrl;
        }

        return session;
      }
    );

    // Update the data source
    this.dataSource = new MatTableDataSource(this.sessions);
    // Set filter predicate again (lost when creating new data source)
    this.setFilterPredicate();
    this.totalRecords = this.sessions.length;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      // Reapply filters after data source update
      this.applyAllFilters();
    }, 100);
  }

  /**
   * Gets a signed (presigned) URL for viewing a PDF.
   * Opens a loading dialog and then opens the PDF in a new window.
   * @param {Session & { pdfVersion?: number }} session - The session object with optional pdfVersion
   * @param {string} promptVersion - The prompt version ('v1' or 'v2')
   * @returns {void}
   */
  public getSignedPdfUrl(
    session: Session & { pdfVersion?: number },
    promptVersion: string
  ): void {
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    const normalizedSessionType = this.normalizeSessionType(
      session.Type || 'primary'
    );
    const data = {
      eventId: this.selectedEvent,
      sessionId: session.SessionId,
      sessionType: normalizedSessionType,
      reportType: 'session_debrief',
      version: session.pdfVersion || 0,
      promptVersion: promptVersion,
    };

    this._backendApiService.getSignedPdfUrl(data).subscribe({
      next: (response: any) => {
        console.log(response['presignedUrl']);
        dialogRef.close();
        window.open(response['presignedUrl'], '_blank');
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching PDF URL:', error);
        this.displayErrorMessage('Failed to open PDF. Please try again.');
      },
    });
  }

  /**
   * Opens PDF version 1 for a session.
   * @param {Session & { pdfVersion?: number }} session - The session object
   * @returns {void}
   */
  public viewPdfV1(session: Session & { pdfVersion?: number }): void {
    if (!session.pdfVersion) {
      this.displayErrorMessage('No PDF version available for this session.');
      return;
    }
    this.getSignedPdfUrl(session, 'v1');
  }

  /**
   * Opens PDF version 2 for a session.
   * @param {Session & { pdfVersion?: number }} session - The session object
   * @returns {void}
   */
  public viewPdfV2(session: Session & { pdfVersion?: number }): void {
    if (!session.pdfVersion) {
      this.displayErrorMessage('No PDF version available for this session.');
      return;
    }
    this.getSignedPdfUrl(session, 'v2');
  }

  /**
   * Handles the toggle of a session checkbox.
   * Adds or removes the session from the selectedSessions set.
   * @param {string} sessionId - The identifier of the session
   * @param {boolean} checked - Whether the checkbox is checked
   * @returns {void}
   */
  public onSessionToggle(sessionId: string, checked: boolean): void {
    if (checked) {
      this.selectedSessions.add(sessionId);
    } else {
      this.selectedSessions.delete(sessionId);
    }
  }

  /**
   * Checks if a session is currently selected.
   * @param {string} sessionId - The identifier of the session
   * @returns {boolean} True if the session is selected, false otherwise
   */
  public isSessionSelected(sessionId: string): boolean {
    return this.selectedSessions.has(sessionId);
  }

  /**
   * Refreshes the events list and reloads sessions if an event is selected.
   * Clears all checkbox selections on refresh.
   * @returns {void}
   */
  public refreshEvents(): void {
    // Clear all checkbox selections
    this.selectedSessions.clear();
    this.getEvents();
    if (this.selectedEvent) {
      this.getSessionsForEvent(this.selectedEvent);
    }
  }

  /**
   * Publishes a PDF report for a session.
   * @param {number} version - The version number of the PDF
   * @param {string} promptVersion - The prompt version ('v1' or 'v2')
   * @param {string} sessionId - The identifier of the session
   * @param {string} sessionType - The type of the session
   * @param {string} [reportType='session_debrief'] - The type of report to publish
   * @returns {Observable<any>} An observable that emits the publish response
   */
  public publishPDF(
    version: number,
    promptVersion: string,
    sessionId: string,
    sessionType: string,
    reportType: string = 'session_debrief'
  ): Observable<any> {
    const data = {
      eventId: this.selectedEvent,
      sessionId: sessionId,
      sessionType: sessionType,
      reportType: reportType,
      version: version,
      promptVersion: promptVersion,
    };
    return this._backendApiService.publishPdfReport(data);
  }

  /**
   * Publishes reports for all selected sessions.
   * Publishes PDF version 2 (latest) for each selected session in parallel.
   * Shows success/error messages and refreshes the sessions list after completion.
   * @returns {void}
   */
  public publishReport(): void {
    if (this.selectedSessions.size === 0) {
      this.displayErrorMessage(
        'Please select at least one session to publish.'
      );
      return;
    }

    const selectedSessionIds = Array.from(this.selectedSessions);
    const selectedSessionsData = this.sessions.filter((session) =>
      selectedSessionIds.includes(session.SessionId)
    );

    // Filter sessions that have PDF versions available
    const sessionsToPublish = selectedSessionsData.filter(
      (session: Session & { pdfVersion?: number }) => session.pdfVersion
    );

    if (sessionsToPublish.length === 0) {
      this.displayErrorMessage(
        'No sessions with PDF versions available to publish.'
      );
      return;
    }

    // Open loading dialog
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: {
          message: `Publishing reports for ${sessionsToPublish.length} session(s)...`,
        },
      }
    );

    // Create array of publish observables with error handling
    const publishObservables = sessionsToPublish.map(
      (session: Session & { pdfVersion?: number }) => {
        const normalizedSessionType = this.normalizeSessionType(
          session.Type || 'primary'
        );
        // Publish v2 (latest version) with error handling
        return this.publishPDF(
          session.pdfVersion!,
          'v2',
          session.SessionId,
          normalizedSessionType,
          'session_debrief'
        ).pipe(
          catchError((error) => {
            console.error(
              `Error publishing report for session ${session.SessionId}:`,
              error
            );
            // Return error result instead of throwing, so forkJoin doesn't cancel
            return of({
              error: true,
              sessionId: session.SessionId,
              errorMessage: error,
            });
          })
        );
      }
    );

    // Use forkJoin to publish all sessions in parallel
    forkJoin(publishObservables).subscribe({
      next: (responses) => {
        console.log('All reports published:', responses);
        dialogRef.close();

        // Count successful and failed publications
        const successful = responses.filter((r: any) => !r.error).length;
        const failed = responses.filter((r: any) => r.error).length;

        if (failed === 0) {
          this.snackBar.open(
            `Successfully published reports for ${successful} session(s)!`,
            'Close',
            {
              duration: 5000,
              panelClass: ['snackbar-success'],
            }
          );
        } else {
          this.snackBar.open(
            `Published ${successful} session(s) successfully. ${failed} session(s) failed.`,
            'Close',
            {
              duration: 7000,
              panelClass: ['snackbar-error'],
            }
          );
        }

        // Refresh the sessions list
        this.getSessionsForEvent(this.selectedEvent);
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error publishing reports:', error);
        this.displayErrorMessage(
          'Failed to publish some reports. Please try again.'
        );
      },
    });
  }

  /**
   * Opens a published PDF in a new browser window.
   * @param {string} reportUrl - The URL of the published PDF
   * @returns {void}
   */
  public openPublishPdf(reportUrl: string): void {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    } else {
      this.displayErrorMessage('PDF URL is not available.');
    }
  }

  /**
   * Opens an audio player dialog to play the audio file.
   * @param {string} audioUrl - The URL of the audio file to play
   * @returns {void}
   */
  public openAudioPlayer(audioUrl: string): void {
    if (!audioUrl) {
      this.displayErrorMessage('Audio URL is not available.');
      return;
    }

    this.dialog.open(AudioPlayerDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { audioUrl: audioUrl },
      disableClose: false,
    });
  }

  /**
   * Displays an error message in a snack bar notification.
   * @param {string} message - The error message to display
   * @returns {void}
   */
  public displayErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 20000,
      panelClass: ['snackbar-error'],
    });
  }

  /**
   * Filters events based on the search input.
   * @param {string} value - The search input value
   * @returns {void}
   */
  public filterEvents(value: string): void {
    this.eventSearchInput = value;
    if (!value) {
      this.filteredEvents = this.events;
      return;
    }

    const filterValue = value.toLowerCase();
    this.filteredEvents = this.events.filter(
      (event) =>
        event.EventIdentifier?.toLowerCase().includes(filterValue) ||
        event.Domain?.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Gets the display value for the selected event.
   * @param {EventConfig | string | null} event - The event object or string
   * @returns {string} The display string for the event
   */
  public getEventDisplayValue = (
    event: EventConfig | string | null
  ): string => {
    if (!event) {
      return '';
    }
    if (typeof event === 'string') {
      return event;
    }
    return `${event.EventIdentifier} (${event.Domain})`;
  };

  /**
   * Handles event selection from autocomplete.
   * @param {any} event - The autocomplete selection event
   * @returns {void}
   */
  public onEventSelected(event: any): void {
    const selectedEvent: EventConfig = event.option?.value;
    if (selectedEvent && selectedEvent.EventIdentifier) {
      this.selectedEvent = selectedEvent.EventIdentifier;
      this.eventSearchInput = this.getEventDisplayValue(selectedEvent);
      this.onEventChange(selectedEvent.EventIdentifier);
    }
  }

  /**
   * Handles input change in the event search field.
   * @param {Event} event - The input event
   * @returns {void}
   */
  public onEventInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterEvents(value);

    // If input is cleared, reset selection only if it doesn't match current selection
    if (!value) {
      const currentEvent = this.events.find(
        (e) => e.EventIdentifier === this.selectedEvent
      );
      if (!currentEvent) {
        this.selectedEvent = '';
        this.onEventChange('');
      }
    } else {
      // Check if the typed value matches the currently selected event
      const currentEvent = this.events.find(
        (e) => e.EventIdentifier === this.selectedEvent
      );
      if (currentEvent && value !== this.getEventDisplayValue(currentEvent)) {
        // User is typing a different value, clear selection
        this.selectedEvent = '';
      }
    }
  }
}

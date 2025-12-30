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
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import {
  MarkdownEditorData,
  MarkdownEditorDialogComponent,
} from 'src/app/content-editor/components/edit-content-dialog/markdown-editor-dialog.component';
import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { Session } from '../event-configuration/event-configuration.component';
import { AudioPlayerDialogComponent } from './components/audio-player-dialog/audio-player-dialog.component';
import { DailyDebriefComponent } from './components/daily-debrief/daily-debrief.component';
import { ExecutiveSummaryComponent } from './components/executive-summary/executive-summary.component';
import { LoadingDialogComponent } from './components/loading-dialog/loading-dialog.component';
import { SessionDebriefComponent } from './components/session-debrief/session-debrief.component';
import { TrackDebriefComponent } from './components/track-debrief/track-debrief.component';

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

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
    TopBarComponent,
    SessionDebriefComponent,
    DailyDebriefComponent,
    TrackDebriefComponent,
    ExecutiveSummaryComponent,
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
  /** Material paginator for the track debrief table */
  @ViewChild('trackDebriefPaginator')
  public trackDebriefPaginator!: MatPaginator;
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
  /** Set of selected daily debrief event days */
  public selectedDailyDebriefs: Set<string> = new Set();
  /** Set of selected track debrief tracks */
  public selectedTrackDebriefs: Set<string> = new Set();
  /** Set of selected executive summary IDs */
  public selectedExecutiveSummaries: Set<string> = new Set();

  /** Default session IDs to be selected by default */
  private readonly _defaultSessionIds: string[] = [];

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
  /** Array of unique event days extracted from sessions */
  public uniqueDays: string[] = [];
  /** Selected event day filter value */
  public selectedEventDay: string = '';
  /** Array of unique tracks extracted from sessions */
  public uniqueTracks: string[] = [];
  /** From index for range selection */
  public fromIndex: string | null = null;
  /** To index for range selection */
  public toIndex: string | null = null;
  /** From index for track debrief range selection */
  public fromTrackIndex: string | null = null;
  /** To index for track debrief range selection */
  public toTrackIndex: string | null = null;
  /** Selected track filter value */
  public selectedTrack: string = '';
  /** Track search filter value */
  public trackSearchFilter: string = '';
  /** Publish filter mode for track debrief: 'all' | 'publishPdfOnly' | 'noPublishPdf' */
  public trackDebriefPublishFilterMode:
    | 'all'
    | 'publishPdfOnly'
    | 'noPublishPdf' = 'all';
  /** PDF filter mode for track debrief: 'all' | 'hasV2' | 'noV2' */
  public trackDebriefPdfFilterMode: 'all' | 'hasV2' | 'noV2' = 'all';
  /** Brief filter mode: 'daily_debrief' | 'track_debrief' */
  public briefFilterMode: 'daily_debrief' | 'track_debrief' = 'daily_debrief';
  /** Filter mode for PDF V1 and V2: 'all' | 'pdfV1Only' | 'pdfV2Only' | 'both' | 'either' | 'neither' */
  public pdfFilterMode:
    | 'all'
    | 'pdfV1Only'
    | 'pdfV2Only'
    | 'both'
    | 'either'
    | 'neither' = 'all';

  /** Column definitions for the Material table */
  public displayedColumns: string[] = [
    'select',
    'startDate',
    'startTime',
    'endTime',
    'eventDay',
    'title',
    'sessionid',
    'status',
    'track',
    'Type',
    'edit',
    'pdfPathV1',
    'pdfPathV2',
    'version',
    'publishPdf',
    'audioFile',
  ];

  /** Column definitions for the Other Brief table (excludes publishPdf, audioFile, and edit) */
  public displayedColumnsOtherBrief: string[] = [
    'select',
    'startDate',
    'startTime',
    'endTime',
    'eventDay',
    'title',
    'sessionid',
    'status',
    'track',
    'Type',
    'pdfPathV1',
    'pdfPathV2',
    'version',
  ];

  /** Column definitions for the Daily Debrief table (select, eventDay, pdfPathV2, viewContent, version, publishPdf) */
  public displayedColumnsDailyDebrief: string[] = [
    'select',
    'eventDay',
    'pdfPathV2',
    'viewContent',
    'version',
    'publishPdf',
  ];

  /** Column definitions for the Track Debrief table (select, track, pdfPathV2, viewContent, version, publishPdf) */
  public displayedColumnsTrackDebrief: string[] = [
    'select',
    'track',
    'pdfPathV2',
    'viewContent',
    'version',
    'publishPdf',
  ];

  /** Column definitions for the Executive Summary table (pdfPathV2, viewContent, version, publishPdf) */
  public displayedColumnsExecutiveSummary: string[] = [
    'pdfPathV2',
    'viewContent',
    'version',
    'publishPdf',
  ];

  /** Material table data source for sessions */
  public dataSource = new MatTableDataSource<Session>([]);
  /** Material table data source for daily debrief */
  public dailyDebriefDataSource = new MatTableDataSource<any>([]);
  /** Material table data source for unique tracks (Track Debrief) */
  public trackDebriefDataSource = new MatTableDataSource<any>([]);
  /** Material table data source for executive summary */
  public executiveSummaryDataSource = new MatTableDataSource<any>([]);

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
    this.cdr.markForCheck();
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
    // Set up custom sorting data accessor
    this.setSortingDataAccessor();
    // Set up custom filter predicate
    this.setFilterPredicate();
  }

  /**
   * Sets up the custom sorting data accessor for the data source.
   * This accessor handles date/time sorting and other custom column sorting.
   * @private
   * @returns {void}
   */
  private setSortingDataAccessor(): void {
    this.dataSource.sortingDataAccessor = (
      item: Session & { pdfVersion?: number },
      property: string
    ) => {
      switch (property) {
        case 'startDate':
          // Sort by date part of StartsAt
          return item.StartsAt ? new Date(item.StartsAt).getTime() : 0;
        case 'startTime':
          // Sort by time part of StartsAt
          return item.StartsAt ? new Date(item.StartsAt).getTime() : 0;
        case 'endTime':
          // Sort by time part of EndsAt
          return item.EndsAt ? new Date(item.EndsAt).getTime() : 0;
        case 'eventDay':
          return item.EventDay || '';
        case 'title':
          return item.SessionTitle || '';
        case 'sessionid':
          return item.SessionId || '';
        case 'status':
          return item.Status || '';
        case 'track':
          return item.Track || '';
        case 'Type':
          return item.Type || '';
        case 'version':
          return item.pdfVersion || 0;
        default:
          return (item as any)[property];
      }
    };
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

      // Event Day filter
      const eventDayMatch =
        !this.selectedEventDay || data.EventDay === this.selectedEventDay;

      // Track filter (for Track Debrief)
      const trackMatch =
        this.briefFilterMode !== 'track_debrief' ||
        !this.selectedTrack ||
        data.Track === this.selectedTrack;

      // Track search filter (for Track Debrief)
      const trackSearchMatch =
        this.briefFilterMode !== 'track_debrief' ||
        !this.trackSearchFilter ||
        (data.Track &&
          data.Track.toLowerCase().includes(
            this.trackSearchFilter.toLowerCase()
          ));

      // Brief filter (Daily Brief or Track Brief)
      let briefFilterMatch = true;
      if (this.briefFilterMode === 'daily_debrief') {
        // Daily Brief: filter by Event Day (group by day)
        briefFilterMatch = true; // This will be handled by grouping logic if needed
      } else if (this.briefFilterMode === 'track_debrief') {
        // Track Brief: filter by Track (group by track)
        briefFilterMatch = true; // This will be handled by grouping logic if needed
      }

      // PDF filter mode (V1 and V2)
      let pdfFilterMatch = true;
      const hasPdfV1 = !!(
        (data as any).pdfPathV1 &&
        (typeof (data as any).pdfPathV1 === 'string'
          ? (data as any).pdfPathV1.trim().length > 0
          : (data as any).pdfPathV1)
      );
      const hasPdfV2 = !!(
        (data as any).pdfPathV2 &&
        (typeof (data as any).pdfPathV2 === 'string'
          ? (data as any).pdfPathV2.trim().length > 0
          : (data as any).pdfPathV2)
      );

      switch (this.pdfFilterMode) {
        case 'pdfV1Only':
          pdfFilterMatch = hasPdfV1 && !hasPdfV2;
          break;
        case 'pdfV2Only':
          pdfFilterMatch = hasPdfV2 && !hasPdfV1;
          break;
        case 'both':
          pdfFilterMatch = hasPdfV1 && hasPdfV2;
          break;
        case 'either':
          pdfFilterMatch = hasPdfV1 || hasPdfV2;
          break;
        case 'neither':
          pdfFilterMatch = !hasPdfV1 && !hasPdfV2;
          break;
        case 'all':
        default:
          pdfFilterMatch = true;
          break;
      }

      return (
        textMatch &&
        fileFilterMatch &&
        eventDayMatch &&
        trackMatch &&
        trackSearchMatch &&
        pdfFilterMatch &&
        briefFilterMatch
      );
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
  getEventReportDetailsForEvent(eventIdentifier: string): void {
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
          // Map report URLs to daily and track debriefs
          this.mapReportUrlsToDailyAndTrackDebriefs();
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
  onEventChange(eventIdentifier: string): void {
    if (!eventIdentifier) {
      this.sessions = [];
      this.dataSource = new MatTableDataSource([]);
      this.setSortingDataAccessor();
      this.setFilterPredicate();
      this.selectedSessions.clear();
      this.selectedDailyDebriefs.clear();
      this.selectedTrackDebriefs.clear();
      this.selectedExecutiveSummaries.clear();
      // Reset filters
      this.textFilterValue = '';
      this.fileFilterMode = 'all';
      this.pdfFilterMode = 'all';
      this.selectedEventDay = '';
      this.uniqueDays = [];
      this.selectedTrack = '';
      this.uniqueTracks = [];
      this.trackSearchFilter = '';
      this.trackDebriefPublishFilterMode = 'all';
      this.trackDebriefPdfFilterMode = 'all';
      // Reset range selections
      this.fromIndex = null;
      this.toIndex = null;
      this.fromTrackIndex = null;
      this.toTrackIndex = null;
      this.briefFilterMode = 'daily_debrief';
      // Reset event search input
      this.eventSearchInput = '';
      this.filteredEvents = this.events;
      return;
    }

    this.selectedEvent = eventIdentifier;
    this.isLoadingSessions = true;
    this.selectedSessions.clear();
    this.selectedDailyDebriefs.clear();
    this.selectedTrackDebriefs.clear();
    this.selectedExecutiveSummaries.clear();
    // Reset filters
    this.textFilterValue = '';
    this.fileFilterMode = 'all';
    this.pdfFilterMode = 'all';
    this.selectedEventDay = '';
    this.uniqueDays = [];
    this.briefFilterMode = 'daily_debrief';

    this.getSessionsForEvent(eventIdentifier);
  }

  /**
   * Highlights a row in the table when clicked.
   * @param {Session} row - The session row that was clicked
   * @param {number} index - The index of the row in the table
   * @returns {void}
   */
  highlightRow(row: Session | any, index: number): void {
    this.selectedRowIndex = index;
  }

  /**
   * Applies a filter to the sessions table based on the search input.
   * @param {Event} event - The keyboard event from the search input
   * @returns {void}
   */
  applyFilter(event: Event): void {
    this.textFilterValue = (event.target as HTMLInputElement).value.trim();
    this.applyAllFilters();
  }

  /**
   * Applies all active filters (text and file filter mode) to the table.
   * @returns {void}
   */
  applyAllFilters(): void {
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
  onFileFilterModeChange(mode: string): void {
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
   * Extracts unique event days from the sessions array.
   * @private
   * @returns {void}
   */
  private extractUniqueDays(): void {
    if (!this.sessions || this.sessions.length === 0) {
      this.uniqueDays = [];
      return;
    }

    const days = this.sessions
      .map((session) => session.EventDay)
      .filter((day) => day && day.trim().length > 0);

    this.uniqueDays = Array.from(new Set(days)).sort();
  }

  /**
   * Extracts unique tracks from the sessions array.
   * @private
   * @returns {void}
   */
  private extractUniqueTracks(): void {
    if (!this.sessions || this.sessions.length === 0) {
      this.uniqueTracks = [];
      return;
    }

    const tracks = this.sessions
      .map((session) => session.Track)
      .filter((track) => track && track.trim().length > 0);

    this.uniqueTracks = Array.from(new Set(tracks)).sort();
  }

  /**
   * Gets the latest PDF paths (V1 and V2) for a track using contentIdentifier.
   * Filters content versions by contentIdentifier format: "Event Name | Track Name"
   * @param {string} trackName - The name of the track
   * @returns {Object|null} An object containing pdfPathV1, pdfPathV2, version, and contentIdentifier, or null if not found
   */
  private getLatestPdfPathsForTrack(trackName: string): {
    pdfPathV1: string;
    pdfPathV2: string;
    version: number;
    contentIdentifier: string;
  } | null {
    if (
      !this.contentVersions ||
      this.contentVersions.length === 0 ||
      !this.selectedEvent ||
      !trackName
    ) {
      return null;
    }

    // Separate trackName by underscore and join with space
    const separatedTrackName = trackName.split(' ').join('_');

    // Create contentIdentifier in format: "Event Name | Track Name" (with separated track name)
    const contentIdentifier = `${this.selectedEvent}|${separatedTrackName}`;

    console.log('contentIdentifier', contentIdentifier);

    // Filter versions by contentIdentifier and reportType (track_debrief)
    // Use lowercase comparison on both sides for case-insensitive matching
    const matchingVersions = this.contentVersions.filter(
      (version: any) =>
        version.contentIdentifier?.toLowerCase() ===
          contentIdentifier.toLowerCase() &&
        version.reportType === 'track_debrief'
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
    // Handle both camelCase and snake_case field names, and trim whitespace
    const pdfPathV1 = (
      latestVersion.pdfPathV1 ||
      latestVersion.pdf_path_v1 ||
      ''
    ).trim();
    const pdfPathV2 = (
      latestVersion.pdfPathV2 ||
      latestVersion.pdf_path_v2 ||
      ''
    ).trim();

    return {
      pdfPathV1: pdfPathV1 || '',
      pdfPathV2: pdfPathV2 || '',
      version: latestVersion.version || 0,
      contentIdentifier: latestVersion.contentIdentifier || contentIdentifier,
    };
  }

  /**
   * Generates unique tracks data for Track Debrief table.
   * Groups sessions by track and gets PDF information from content-versions API
   * filtered by contentIdentifier: "Event Name | Track Name"
   * @private
   * @returns {void}
   */
  private generateUniqueTracksData(): void {
    if (!this.sessions || this.sessions.length === 0) {
      this.trackDebriefDataSource = new MatTableDataSource([]);
      return;
    }

    // Group sessions by track
    const trackMap = new Map<string, Session[]>();
    this.sessions.forEach((session) => {
      const track = session.Track || '';
      if (track && track.trim().length > 0) {
        if (!trackMap.has(track)) {
          trackMap.set(track, []);
        }
        trackMap.get(track)!.push(session);
      }
    });

    // Create unique track entries with PDF information from content-versions API
    const uniqueTracksData: any[] = [];
    trackMap.forEach((sessions, track) => {
      // Get PDF information from content-versions API filtered by contentIdentifier
      const pdfPaths = this.getLatestPdfPathsForTrack(track);

      uniqueTracksData.push({
        Track: track,
        pdfPathV1: pdfPaths?.pdfPathV1 || '',
        pdfPathV2: pdfPaths?.pdfPathV2 || '',
        version: pdfPaths?.version || 0,
        reportUrl: '', // Will be populated from eventReportDetails
        // Store track name for PDF viewing
        _trackName: track,
      });
    });

    // Sort by track name
    uniqueTracksData.sort((a, b) => a.Track.localeCompare(b.Track));

    // Update the track debrief data source
    this.trackDebriefDataSource = new MatTableDataSource(uniqueTracksData);
    console.log(
      'Track Debrief displayedColumns:',
      this.displayedColumnsTrackDebrief
    );
    console.log('Track Debrief data:', uniqueTracksData);
    // Set up filter predicate for track search, publish filter, and PDF filter
    this.setupTrackDebriefFilterPredicate();
    setTimeout(() => {
      this.trackDebriefDataSource.sort = this.sort;
      if (this.trackDebriefPaginator) {
        this.trackDebriefDataSource.paginator = this.trackDebriefPaginator;
      }
    }, 100);
  }

  /**
   * Sets up the filter predicate for the track debrief data source.
   * This method should be called whenever a new MatTableDataSource is created.
   * @returns {void}
   */
  setupTrackDebriefFilterPredicate(): void {
    if (!this.trackDebriefDataSource) {
      return;
    }
    // Set up filter predicate for track search, publish filter, and PDF filter
    this.trackDebriefDataSource.filterPredicate = (
      data: any,
      filter: string
    ) => {
      // Text search filter
      const textMatch =
        !this.trackSearchFilter ||
        data.Track?.toLowerCase().includes(
          this.trackSearchFilter.toLowerCase()
        ) ||
        false;

      // Publish PDF filter
      const hasPublishPdf = !!(
        data.reportUrl &&
        (typeof data.reportUrl === 'string'
          ? data.reportUrl.trim().length > 0
          : data.reportUrl)
      );

      let publishFilterMatch = true;
      switch (this.trackDebriefPublishFilterMode) {
        case 'publishPdfOnly':
          publishFilterMatch = hasPublishPdf;
          break;
        case 'noPublishPdf':
          publishFilterMatch = !hasPublishPdf;
          break;
        case 'all':
        default:
          publishFilterMatch = true;
          break;
      }

      // PDF filter - only check for V2
      const hasPdfV2 = !!(
        data.pdfPathV2 &&
        (typeof data.pdfPathV2 === 'string'
          ? data.pdfPathV2.trim().length > 0
          : data.pdfPathV2)
      );

      let pdfFilterMatch = true;
      switch (this.trackDebriefPdfFilterMode) {
        case 'hasV2':
          pdfFilterMatch = hasPdfV2;
          break;
        case 'noV2':
          pdfFilterMatch = !hasPdfV2;
          break;
        case 'all':
        default:
          pdfFilterMatch = true;
          break;
      }

      const result = textMatch && publishFilterMatch && pdfFilterMatch;
      return result;
    };
  }

  /**
   * Generates unique event days data for Daily Debrief table.
   * Groups sessions by event day and gets PDF information from content-versions API
   * filtered by contentIdentifier: "Event Name | Daily Debrief ID"
   * @private
   * @returns {void}
   */
  private generateUniqueEventDaysData(): void {
    if (!this.sessions || this.sessions.length === 0) {
      this.dailyDebriefDataSource = new MatTableDataSource([]);
      return;
    }

    // Group sessions by event day
    const eventDayMap = new Map<string, Session[]>();
    this.sessions.forEach((session) => {
      const eventDay = session.EventDay || '';
      if (eventDay && eventDay.trim().length > 0) {
        if (!eventDayMap.has(eventDay)) {
          eventDayMap.set(eventDay, []);
        }
        eventDayMap.get(eventDay)!.push(session);
      }
    });

    // Create unique event day entries with PDF information from content-versions API
    const uniqueEventDaysData: any[] = [];
    eventDayMap.forEach((sessions, eventDay) => {
      // Get PDF information from content-versions API filtered by contentIdentifier
      // Format: "EventName|DailyDebriefId" where DailyDebriefId is the event day
      const dailyDebriefId = eventDay.replace(/\s+/g, '_');
      const pdfPaths = this.getLatestPdfPathsForDailyDebrief(dailyDebriefId);

      uniqueEventDaysData.push({
        EventDay: eventDay,
        pdfPathV1: pdfPaths?.pdfPathV1 || '',
        pdfPathV2: pdfPaths?.pdfPathV2 || '',
        version: pdfPaths?.version || 0,
        reportUrl: '', // Will be populated from eventReportDetails
        // Store event day for PDF viewing
        _eventDay: eventDay,
        _dailyDebriefId: dailyDebriefId,
      });
    });

    // Sort by event day
    uniqueEventDaysData.sort((a, b) => a.EventDay.localeCompare(b.EventDay));

    // Update the daily debrief data source
    this.dailyDebriefDataSource = new MatTableDataSource(uniqueEventDaysData);
    console.log(
      'Daily Debrief displayedColumns:',
      this.displayedColumnsDailyDebrief
    );
    console.log('Daily Debrief data:', uniqueEventDaysData);
    // Set up filter predicate for event day filter
    this.dailyDebriefDataSource.filterPredicate = (
      data: any,
      filter: string
    ) => {
      if (!filter) return true;
      return data.EventDay === filter;
    };
    setTimeout(() => {
      this.dailyDebriefDataSource.sort = this.sort;
      if (this.paginator) {
        this.dailyDebriefDataSource.paginator = this.paginator;
      }
    }, 100);
  }

  /**
   * Gets the latest PDF paths for a daily debrief by daily debrief ID.
   * @param {string} dailyDebriefId - The daily debrief ID (e.g., "Day_1")
   * @returns {any} Object with pdfPathV1, pdfPathV2, and version
   * @private
   */
  private getLatestPdfPathsForDailyDebrief(dailyDebriefId: string): any {
    if (!this.selectedEvent || !this.contentVersions || !dailyDebriefId) {
      return null;
    }

    // Create contentIdentifier in format: "Event Name | Daily Debrief ID"
    const contentIdentifier = `${this.selectedEvent}|${dailyDebriefId}`;

    // Filter versions by contentIdentifier and reportType (daily_debrief)
    // Use lowercase comparison on both sides for case-insensitive matching
    const matchingVersions = this.contentVersions.filter(
      (version: any) =>
        version.contentIdentifier?.toLowerCase() ===
          contentIdentifier.toLowerCase() &&
        version.reportType === 'daily_debrief'
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
    // Handle both camelCase and snake_case field names, and trim whitespace
    const pdfPathV1 = (
      latestVersion.pdfPathV1 ||
      latestVersion.pdf_path_v1 ||
      ''
    ).trim();
    const pdfPathV2 = (
      latestVersion.pdfPathV2 ||
      latestVersion.pdf_path_v2 ||
      ''
    ).trim();

    return {
      pdfPathV1: pdfPathV1 || '',
      pdfPathV2: pdfPathV2 || '',
      version: latestVersion.version || 0,
    };
  }

  /**
   * Applies the track search filter for Track Debrief table.
   * @param {Event} event - The keyboard event from the search input
   * @returns {void}
   */
  applyTrackDebriefSearchFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.trackSearchFilter = filterValue;
    // Apply filter using the helper method
    this.applyTrackDebriefFilters();
  }

  /**
   * Handles the publish filter mode change for track debrief.
   * @param {string} mode - The filter mode: 'all' | 'publishPdfOnly' | 'noPublishPdf'
   * @returns {void}
   */
  onTrackDebriefPublishFilterModeChange(mode: string): void {
    this.trackDebriefPublishFilterMode = mode as
      | 'all'
      | 'publishPdfOnly'
      | 'noPublishPdf';
    console.log('Track Debrief Publish Filter changed to:', mode);
    // Trigger filter by forcing a re-evaluation
    this.applyTrackDebriefFilters();
  }

  /**
   * Handles the PDF filter mode change for track debrief.
   * @param {string} mode - The filter mode: 'all' | 'hasV2' | 'noV2'
   * @returns {void}
   */
  onTrackDebriefPdfFilterModeChange(mode: string): void {
    this.trackDebriefPdfFilterMode = mode as 'all' | 'hasV2' | 'noV2';
    console.log('Track Debrief PDF Filter changed to:', mode);
    // Trigger filter by forcing a re-evaluation
    this.applyTrackDebriefFilters();
  }

  /**
   * Applies all filters to the track debrief data source.
   * @returns {void}
   */
  applyTrackDebriefFilters(): void {
    if (!this.trackDebriefDataSource) {
      return;
    }
    // Ensure filter predicate is set up
    if (!this.trackDebriefDataSource.filterPredicate) {
      this.setupTrackDebriefFilterPredicate();
    }
    // Get current filter value
    const currentFilter = this.trackSearchFilter || '';

    // Force filter re-evaluation by temporarily clearing and resetting
    // This ensures the predicate is re-run with updated filter modes
    this.trackDebriefDataSource.filter = '';
    setTimeout(() => {
      this.trackDebriefDataSource.filter = currentFilter || ' ';
      this.updateTrackDebriefTable();
    }, 0);
  }

  /**
   * Updates the track debrief table after filter changes.
   * @returns {void}
   */
  updateTrackDebriefTable(): void {
    if (!this.trackDebriefDataSource) {
      return;
    }
    // Ensure paginator is connected and reset to first page
    if (this.trackDebriefPaginator) {
      this.trackDebriefDataSource.paginator = this.trackDebriefPaginator;
      this.trackDebriefPaginator.firstPage();
    }
    // Ensure sort is connected
    if (this.sort) {
      this.trackDebriefDataSource.sort = this.sort;
    }

    // Log filter state for debugging
    const filteredData = this.trackDebriefDataSource.filteredData;
    console.log('Track Debrief filter applied:', {
      searchFilter: this.trackSearchFilter,
      publishFilter: this.trackDebriefPublishFilterMode,
      pdfFilter: this.trackDebriefPdfFilterMode,
      filteredCount: filteredData?.length || 0,
      totalCount: this.trackDebriefDataSource.data?.length || 0,
      filterValue: this.trackDebriefDataSource.filter,
    });

    // Force change detection
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * Handles the event day filter change.
   * @param {string} eventDay - The selected event day filter value
   * @returns {void}
   */
  onEventDayFilterChange(eventDay: string): void {
    this.selectedEventDay = eventDay;
    this.applyAllFilters();
  }

  /**
   * Handles the event day filter change for Daily Debrief table.
   * @param {string} eventDay - The selected event day filter value
   * @returns {void}
   */
  onDailyDebriefEventDayFilterChange(eventDay: string): void {
    if (this.dailyDebriefDataSource) {
      this.dailyDebriefDataSource.filter = eventDay || '';
      if (this.paginator) {
        this.dailyDebriefDataSource.paginator = this.paginator;
        this.paginator.firstPage();
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Handles the Brief filter mode change.
   * @param {string} mode - The filter mode: 'daily_debrief' | 'track_debrief'
   * @returns {void}
   */
  onBriefFilterModeChange(mode: string): void {
    this.briefFilterMode = mode as 'daily_debrief' | 'track_debrief';
    // Reset track filter when switching modes
    if (mode === 'daily_debrief') {
      this.selectedTrack = '';
      this.trackSearchFilter = '';
    }
    this.applyAllFilters();
  }

  /**
   * Handles the Other Brief tab change (nested tabs).
   * @param {any} event - The tab change event containing the index
   * @returns {void}
   */
  /**
   * Handles the main tab change (Session Debrief vs Other Debrief).
   * @param {any} event - The tab change event containing the index
   * @returns {void}
   */
  onMainTabChange(event: any): void {
    const tabIndex = event.index !== undefined ? event.index : 0;
    // If Other Debrief tab is selected (index 1), generate data for the default sub-tab (Daily Debrief)
    if (tabIndex === 1) {
      // Generate data for Daily Debrief (default sub-tab)
      this.generateUniqueEventDaysData();
      // Map report URLs after regenerating data to preserve published PDF URLs
      setTimeout(() => {
        this.mapReportUrlsToDailyAndTrackDebriefs();
      }, 0);
    }
  }

  onOtherBriefTabChange(event: any): void {
    const tabIndex = event.index !== undefined ? event.index : 0;
    const mode = tabIndex === 0 ? 'daily_debrief' : 'track_debrief';
    this.onBriefFilterModeChange(mode);

    // Generate data for the selected tab
    if (tabIndex === 0) {
      // Daily Debrief tab
      this.generateUniqueEventDaysData();
    } else {
      // Track Debrief tab
      this.generateUniqueTracksData();
    }

    // Map report URLs after regenerating data to preserve published PDF URLs
    setTimeout(() => {
      this.mapReportUrlsToDailyAndTrackDebriefs();
    }, 0);
  }

  /**
   * Handles the track filter change.
   * @param {string} track - The selected track filter value
   * @returns {void}
   */
  onTrackFilterChange(track: string): void {
    this.selectedTrack = track;
    this.applyAllFilters();
  }

  /**
   * Applies the track search filter.
   * @param {Event} event - The keyboard event from the search input
   * @returns {void}
   */
  applyTrackSearchFilter(event: Event): void {
    this.trackSearchFilter = (event.target as HTMLInputElement).value.trim();
    this.applyAllFilters();
  }

  /**
   * Handles the PDF filter mode change.
   * @param {string} mode - The filter mode: 'all' | 'pdfV1Only' | 'pdfV2Only' | 'both' | 'either' | 'neither'
   * @returns {void}
   */
  onPdfFilterModeChange(mode: string): void {
    this.pdfFilterMode = mode as
      | 'all'
      | 'pdfV1Only'
      | 'pdfV2Only'
      | 'both'
      | 'either'
      | 'neither';
    this.applyAllFilters();
  }

  /**
   * Gets the currently filtered/visible sessions from the data source.
   * @returns {Session[]} Array of filtered sessions
   */
  getFilteredSessions(): Session[] {
    return this.dataSource.filteredData || this.dataSource.data || [];
  }

  /**
   * Gets the filtered track debriefs from the data source.
   * @returns {any[]} Array of filtered track debrief rows
   */
  getFilteredTrackDebriefs(): any[] {
    return (
      this.trackDebriefDataSource.filteredData ||
      this.trackDebriefDataSource.data ||
      []
    );
  }

  /**
   * Gets the count of selected sessions that are currently visible (filtered).
   * @returns {number} Count of selected visible sessions
   */
  getSelectedFilteredCount(): number {
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
  toggleAllSessions(checked: boolean): void {
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
  isAllSelected(): boolean {
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
  isIndeterminate(): boolean {
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
  getStatusClass(status: string): string {
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
  getSessionsForEvent(eventIdentifier: string): void {
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

        // Auto-select default session IDs if they exist in the filtered sessions
        this.selectDefaultSessions();

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
          // Extract unique event days
          this.extractUniqueDays();
          // Extract unique tracks
          this.extractUniqueTracks();
          // Trigger change detection to update UI
          this.cdr.markForCheck();

          // Map report URLs to sessions (without updating data source yet)
          this.mapReportUrlsToSessions(false);

          // Enrich sessions with PDF paths (this will update data source at the end)
          this.enrichSessionsWithPdfPaths();
        } else {
          // No sessions found, initialize empty data source
          this.dataSource = new MatTableDataSource([]);
          this.setSortingDataAccessor();
          this.setFilterPredicate();
          this.totalRecords = 0;
          // Clear Daily Debrief, Track Debrief, and Executive Summary data sources
          this.dailyDebriefDataSource = new MatTableDataSource([]);
          this.trackDebriefDataSource = new MatTableDataSource([]);
          this.executiveSummaryDataSource = new MatTableDataSource([]);
        }

        this.isLoadingSessions = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error in forkJoin:', error);
        this.displayErrorMessage('Failed to load data. Please try again.');
        this.sessions = [];
        this.dataSource = new MatTableDataSource([]);
        this.setSortingDataAccessor();
        this.setFilterPredicate();
        // Clear Daily Debrief and Track Debrief data sources
        this.dailyDebriefDataSource = new MatTableDataSource([]);
        this.trackDebriefDataSource = new MatTableDataSource([]);
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
  getContentVersionsByEventId(
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
    const typeMap: Record<string, string> = {
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
   * Gets the latest PDF paths (V1 and V2) for a specific session based on brief filter mode.
   * For Other Brief tab: returns daily_brief or track_debrief PDFs based on briefFilterMode.
   * Ignores sessionType filter for daily_debrief and track_debrief.
   * @param {Session} session - The session object
   * @returns {Object|null} An object containing pdfPathV1, pdfPathV2, and version, or null if not found
   */
  getLatestPdfPathsForOtherBrief(
    session: Session
  ): { pdfPathV1: string; pdfPathV2: string; version: number } | null {
    if (!session || !this.briefFilterMode) {
      return null;
    }

    // Ignore sessionType filter for daily_debrief and track_debrief
    return this.getLatestPdfPathsForSessionIgnoringSessionType(
      session.SessionId,
      this.briefFilterMode
    );
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
  getLatestPdfPathsForSession(
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
   * Gets the latest PDF paths (V1 and V2) for a specific session ignoring sessionType filter.
   * Used for daily_debrief and track_debrief report types.
   * @param {string} sessionId - The identifier of the session
   * @param {string} reportType - The type of report
   * @returns {Object|null} An object containing pdfPathV1, pdfPathV2, and version, or null if not found
   */
  getLatestPdfPathsForSessionIgnoringSessionType(
    sessionId: string,
    reportType: string
  ): { pdfPathV1: string; pdfPathV2: string; version: number } | null {
    if (!this.contentVersions || this.contentVersions.length === 0) {
      return null;
    }

    // Filter versions by sessionId and reportType only (ignore sessionType)
    const matchingVersions = this.contentVersions.filter(
      (version: any) =>
        version.sessionId === sessionId && version.reportType === reportType
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
  mapReportUrlsToSessions(updateDataSource: boolean = true): void {
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
      // Set sorting data accessor and filter predicate again (lost when creating new data source)
      this.setSortingDataAccessor();
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
  enrichSessionsWithPdfPaths(): void {
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
    // Set sorting data accessor and filter predicate again (lost when creating new data source)
    this.setSortingDataAccessor();
    this.setFilterPredicate();
    this.totalRecords = this.sessions.length;

    // Generate unique tracks data for Track Debrief
    this.generateUniqueTracksData();
    // Generate unique event days data for Daily Debrief
    this.generateUniqueEventDaysData();
    // Generate executive summary data
    this.generateExecutiveSummaryData();
    // Map report URLs to daily and track debriefs
    this.mapReportUrlsToDailyAndTrackDebriefs();

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      // Reapply filters after data source update
      this.applyAllFilters();
    }, 100);
  }

  /**
   * Maps published report URLs from eventReportDetails to daily, track debriefs, and executive summary.
   * Updates the data sources with reportUrl properties.
   * @returns {void}
   */
  mapReportUrlsToDailyAndTrackDebriefs(): void {
    if (!this.eventReportDetails) {
      console.log(
        'mapReportUrlsToDailyAndTrackDebriefs: No eventReportDetails'
      );
      return;
    }

    // Handle both possible response structures: eventReportDetails.data or eventReportDetails directly
    const responseData =
      this.eventReportDetails.data || this.eventReportDetails;

    if (!responseData) {
      console.log('mapReportUrlsToDailyAndTrackDebriefs: No response data');
      return;
    }

    console.log(
      'mapReportUrlsToDailyAndTrackDebriefs: responseData',
      responseData
    );
    console.log(
      'mapReportUrlsToDailyAndTrackDebriefs: tracks',
      responseData.tracks
    );
    console.log(
      'mapReportUrlsToDailyAndTrackDebriefs: dailyReport',
      responseData.dailyReport
    );
    console.log(
      'mapReportUrlsToDailyAndTrackDebriefs: executiveSummaryReport',
      responseData.executiveSummaryReport
    );

    // Map track report URLs
    if (responseData.tracks && Array.isArray(responseData.tracks)) {
      const trackReportUrlMap = new Map<string, string>();
      responseData.tracks.forEach((trackReport: any) => {
        if (trackReport.Track && trackReport.ReportUrl) {
          trackReportUrlMap.set(trackReport.Track, trackReport.ReportUrl);
          console.log(
            `Mapped track: ${trackReport.Track} -> ${trackReport.ReportUrl}`
          );
        }
      });

      console.log(
        'Track report URL map:',
        Array.from(trackReportUrlMap.entries())
      );

      // Update track debrief data source
      if (
        this.trackDebriefDataSource &&
        this.trackDebriefDataSource.data &&
        this.trackDebriefDataSource.data.length > 0
      ) {
        console.log(
          'Track debrief data source rows:',
          this.trackDebriefDataSource.data.length
        );
        const updatedData = this.trackDebriefDataSource.data.map((row: any) => {
          const reportUrl = trackReportUrlMap.get(row.Track);
          if (reportUrl) {
            console.log(
              `Found report URL for track ${row.Track}: ${reportUrl}`
            );
          }
          return {
            ...row,
            reportUrl: reportUrl || row.reportUrl || '',
          };
        });
        // Update data source - create new instance to ensure change detection
        const currentPaginator =
          this.trackDebriefDataSource.paginator || this.trackDebriefPaginator;
        const currentSort = this.trackDebriefDataSource.sort || this.sort;
        const currentFilter =
          this.trackDebriefDataSource.filter || this.trackSearchFilter || ' ';
        this.trackDebriefDataSource = new MatTableDataSource(updatedData);
        // Restore filter predicate
        this.setupTrackDebriefFilterPredicate();
        // Restore paginator, sort, and filter
        setTimeout(() => {
          if (currentPaginator) {
            this.trackDebriefDataSource.paginator = currentPaginator;
          }
          if (currentSort) {
            this.trackDebriefDataSource.sort = currentSort;
          }
          // Restore filter value to trigger filtering
          this.trackDebriefDataSource.filter = currentFilter;
          // Force change detection
          this.cdr.detectChanges();
        }, 0);
        // Trigger change detection
        this.cdr.detectChanges();
        console.log('Updated track debrief data source with report URLs');
      } else {
        console.log('Track debrief data source is empty or not initialized');
      }
    } else {
      console.log('No tracks array in response data');
    }

    // Map daily report URLs
    if (responseData.dailyReport && Array.isArray(responseData.dailyReport)) {
      const dailyReportUrlMap = new Map<string, string>();
      responseData.dailyReport.forEach((dailyReport: any) => {
        if (dailyReport.Day && dailyReport.ReportUrl) {
          dailyReportUrlMap.set(dailyReport.Day, dailyReport.ReportUrl);
          console.log(
            `Mapped daily report: ${dailyReport.Day} -> ${dailyReport.ReportUrl}`
          );
        }
      });

      console.log(
        'Daily report URL map:',
        Array.from(dailyReportUrlMap.entries())
      );

      // Update daily debrief data source
      if (
        this.dailyDebriefDataSource &&
        this.dailyDebriefDataSource.data &&
        this.dailyDebriefDataSource.data.length > 0
      ) {
        console.log(
          'Daily debrief data source rows:',
          this.dailyDebriefDataSource.data.length
        );
        const updatedData = this.dailyDebriefDataSource.data.map((row: any) => {
          const reportUrl = dailyReportUrlMap.get(row.EventDay);
          if (reportUrl) {
            console.log(
              `Found report URL for event day ${row.EventDay}: ${reportUrl}`
            );
          }
          return {
            ...row,
            reportUrl: reportUrl || row.reportUrl || '',
          };
        });

        console.log(
          'Updated daily debrief data source with report URLs',
          updatedData
        );
        // Update data source - create new instance to ensure change detection
        const currentPaginator = this.dailyDebriefDataSource.paginator;
        const currentSort = this.dailyDebriefDataSource.sort;
        this.dailyDebriefDataSource = new MatTableDataSource(updatedData);
        // Restore paginator and sort
        setTimeout(() => {
          this.dailyDebriefDataSource.paginator = currentPaginator;
          this.dailyDebriefDataSource.sort = currentSort;
        }, 0);
        // Trigger change detection
        this.cdr.detectChanges();
        console.log('Updated daily debrief data source with report URLs');
      } else {
        console.log('Daily debrief data source is empty or not initialized');
      }
    } else {
      console.log('No dailyReport array in response data');
    }

    // Map executive summary report URL
    if (
      responseData.executiveSummaryReport &&
      responseData.executiveSummaryReport.ReportUrl
    ) {
      const executiveSummaryReportUrl =
        responseData.executiveSummaryReport.ReportUrl;
      console.log(
        `Mapped executive summary report URL: ${executiveSummaryReportUrl}`
      );

      // Update executive summary data source
      if (
        this.executiveSummaryDataSource &&
        this.executiveSummaryDataSource.data &&
        this.executiveSummaryDataSource.data.length > 0
      ) {
        console.log(
          'Executive summary data source rows:',
          this.executiveSummaryDataSource.data.length
        );
        const updatedData = this.executiveSummaryDataSource.data.map(
          (row: any) => ({
            ...row,
            reportUrl: executiveSummaryReportUrl || row.reportUrl || '',
          })
        );
        // Update data source - create new instance to ensure change detection
        const currentPaginator = this.executiveSummaryDataSource.paginator;
        const currentSort = this.executiveSummaryDataSource.sort;
        this.executiveSummaryDataSource = new MatTableDataSource(updatedData);
        // Restore paginator and sort
        setTimeout(() => {
          this.executiveSummaryDataSource.paginator = currentPaginator;
          this.executiveSummaryDataSource.sort = currentSort;
        }, 0);
        // Trigger change detection
        this.cdr.detectChanges();
        console.log('Updated executive summary data source with report URL');
      } else {
        console.log(
          'Executive summary data source is empty or not initialized'
        );
      }
    } else {
      console.log('No executiveSummaryReport in response data');
    }
  }

  /**
   * Gets a signed (presigned) URL for viewing a PDF.
   * Opens a loading dialog and then opens the PDF in a new window.
   * @param {Session & { pdfVersion?: number }} session - The session object with optional pdfVersion
   * @param {string} promptVersion - The prompt version ('v1' or 'v2')
   * @returns {void}
   */
  getSignedPdfUrl(
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
   * @param {Session | any} session - The session object
   * @returns {void}
   */
  viewPdfV1(session: Session | any): void {
    const sessionWithVersion = session as Session & { pdfVersion?: number };
    if (!sessionWithVersion.pdfVersion) {
      this.displayErrorMessage('No PDF version available for this session.');
      return;
    }
    this.getSignedPdfUrl(sessionWithVersion, 'v1');
  }

  /**
   * Opens PDF version 2 for a session.
   * @param {Session | any} session - The session object
   * @returns {void}
   */
  viewPdfV2(session: Session | any): void {
    const sessionWithVersion = session as Session & { pdfVersion?: number };
    if (!sessionWithVersion.pdfVersion) {
      this.displayErrorMessage('No PDF version available for this session.');
      return;
    }
    this.getSignedPdfUrl(sessionWithVersion, 'v2');
  }

  /**
   * Views PDF V1 for Track Debrief (unique track row).
   * Uses contentIdentifier from content-versions API to get the PDF URL.
   * @param {any} trackRow - The track row object with Track and version properties
   * @returns {void}
   */
  viewPdfV1ForTrackDebrief(trackRow: any): void {
    if (!trackRow.Track || !trackRow.pdfPathV1) {
      this.displayErrorMessage('PDF V1 not available for this track.');
      return;
    }

    const pdfPaths = this.getLatestPdfPathsForTrack(trackRow.Track);
    if (!pdfPaths || !pdfPaths.pdfPathV1) {
      this.displayErrorMessage('PDF V1 not available for this track.');
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    // Get contentIdentifier from the content-versions API response
    const contentIdentifier = pdfPaths.contentIdentifier;
    const reportType = 'track_debrief';
    const data = {
      eventId: this.selectedEvent,
      briefId: contentIdentifier,
      reportType: reportType,
      version: pdfPaths.version || 0,
      promptVersion: 'v1',
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
   * Views PDF V2 for Track Debrief (unique track row).
   * Uses contentIdentifier from content-versions API to get the PDF URL.
   * @param {any} trackRow - The track row object with Track and version properties
   * @returns {void}
   */
  viewPdfV2ForTrackDebrief(trackRow: any): void {
    if (!trackRow.Track || !trackRow.pdfPathV2) {
      this.displayErrorMessage('PDF V2 not available for this track.');
      return;
    }

    const pdfPaths = this.getLatestPdfPathsForTrack(trackRow.Track);
    if (!pdfPaths || !pdfPaths.pdfPathV2) {
      this.displayErrorMessage('PDF V2 not available for this track.');
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    // Get contentIdentifier from the content-versions API response
    const contentIdentifier = pdfPaths.contentIdentifier;
    const reportType = 'track_debrief';
    const data = {
      eventId: this.selectedEvent,
      briefId: contentIdentifier,
      reportType: reportType,
      version: pdfPaths.version || 0,
      promptVersion: 'v2',
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
   * Views PDF V2 for Other Brief (daily_brief or track_debrief based on briefFilterMode).
   * @param {Session} session - The session object
   * @returns {void}
   */
  /**
   * Views PDF V1 for Daily Debrief (unique event day row).
   * Uses contentIdentifier to get the PDF URL.
   * @param {any} dailyDebriefRow - The daily debrief row object with EventDay and version properties
   * @returns {void}
   */
  viewPdfV1ForDailyDebrief(dailyDebriefRow: any): void {
    if (!dailyDebriefRow.EventDay || !dailyDebriefRow.pdfPathV1) {
      this.displayErrorMessage('PDF V1 not available for this event day.');
      return;
    }

    const dailyDebriefId =
      dailyDebriefRow._dailyDebriefId ||
      dailyDebriefRow.EventDay.replace(/\s+/g, '_');
    const pdfPaths = this.getLatestPdfPathsForDailyDebrief(dailyDebriefId);
    if (!pdfPaths || !pdfPaths.pdfPathV1) {
      this.displayErrorMessage('PDF V1 not available for this event day.');
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    // Create contentIdentifier in format: "Event Name | Daily Debrief ID"
    const contentIdentifier = `${this.selectedEvent}|${dailyDebriefId}`;
    const reportType = 'daily_debrief';
    const data = {
      eventId: this.selectedEvent,
      briefId: contentIdentifier,
      reportType: reportType,
      version: pdfPaths.version || 0,
      promptVersion: 'v1',
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
   * Views PDF V2 for Daily Debrief (unique event day row).
   * Uses contentIdentifier to get the PDF URL.
   * @param {any} dailyDebriefRow - The daily debrief row object with EventDay and version properties
   * @returns {void}
   */
  viewPdfV2ForDailyDebrief(dailyDebriefRow: any): void {
    if (!dailyDebriefRow.EventDay || !dailyDebriefRow.pdfPathV2) {
      this.displayErrorMessage('PDF V2 not available for this event day.');
      return;
    }

    const dailyDebriefId =
      dailyDebriefRow._dailyDebriefId ||
      dailyDebriefRow.EventDay.replace(/\s+/g, '_');
    const pdfPaths = this.getLatestPdfPathsForDailyDebrief(dailyDebriefId);
    if (!pdfPaths || !pdfPaths.pdfPathV2) {
      this.displayErrorMessage('PDF V2 not available for this event day.');
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    // Create contentIdentifier in format: "Event Name | Daily Debrief ID"
    const contentIdentifier = `${this.selectedEvent}|${dailyDebriefId}`;
    const reportType = 'daily_debrief';
    const data = {
      eventId: this.selectedEvent,
      briefId: contentIdentifier,
      reportType: reportType,
      version: pdfPaths.version || 0,
      promptVersion: 'v2',
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
   * Edits the content (JSON) for a daily debrief.
   * Similar to editContent but for daily debrief content.
   * @param {any} dailyDebriefRow - The daily debrief row object with EventDay and version properties
   * @returns {void}
   */
  editContentForDailyDebrief(dailyDebriefRow: any): void {
    if (!dailyDebriefRow.EventDay || !dailyDebriefRow.version) {
      this.displayErrorMessage('No version available for this daily debrief.');
      return;
    }

    // Open loading dialog
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Loading content for editing...' },
      }
    );

    const eventDay = dailyDebriefRow.EventDay.replace(/\s+/g, '_');
    const data = {
      eventId: this.selectedEvent,
      eventDay: eventDay,
      reportType: 'daily_debrief',
      version: dailyDebriefRow.version,
    };

    this._backendApiService.getVersionContent(data).subscribe({
      next: (response) => {
        dialogRef.close();
        this.openMarkdownDialogForDailyDebrief(
          response,
          dailyDebriefRow.version,
          dailyDebriefRow
        );
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching version content:', error);
        this.displayErrorMessage(
          'Failed to load content for editing. Please try again.'
        );
      },
    });
  }

  /**
   * Opens the markdown editor dialog for editing daily debrief content.
   * @param {any} content - The content to edit
   * @param {number} version - The version number
   * @param {any} dailyDebriefRow - The daily debrief row object
   * @returns {void}
   */
  openMarkdownDialogForDailyDebrief(
    content: any,
    version: number,
    dailyDebriefRow: any
  ): void {
    const eventDay = dailyDebriefRow.EventDay.replace(/\s+/g, '_');
    const dialogRef = this.dialog.open(MarkdownEditorDialogComponent, {
      data: {
        initialText: JSON.stringify(content, null, 2),
        eventName: this.selectedEvent,
        selected_session: eventDay,
        selectedSessionType: '',
        selectedReportType: 'daily_debrief',
        version: version,
        readOnly: false,
      } as MarkdownEditorData,
      width: '1000px',
      maxWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.edited) {
        // Refresh the daily debrief list to reflect any changes
        this.generateUniqueEventDaysData();
      }
    });
  }

  /**
   * Edits the content (JSON) for a track debrief.
   * Similar to editContentForDailyDebrief but for track debrief content.
   * @param {any} trackDebriefRow - The track debrief row object with Track and version properties
   * @returns {void}
   */
  editContentForTrackDebrief(trackDebriefRow: any): void {
    if (!trackDebriefRow.Track || !trackDebriefRow.version) {
      this.displayErrorMessage('No version available for this track debrief.');
      return;
    }

    // Open loading dialog
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Loading content for editing...' },
      }
    );

    const track = trackDebriefRow.Track.replace(/\s+/g, '_');
    const data = {
      eventId: this.selectedEvent,
      track: track,
      reportType: 'track_debrief',
      version: trackDebriefRow.version,
    };

    this._backendApiService.getVersionContent(data).subscribe({
      next: (response) => {
        dialogRef.close();
        this.openMarkdownDialogForTrackDebrief(
          response,
          trackDebriefRow.version,
          trackDebriefRow
        );
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching version content:', error);
        this.displayErrorMessage(
          'Failed to load content for editing. Please try again.'
        );
      },
    });
  }

  /**
   * Opens the markdown editor dialog for editing track debrief content.
   * @param {any} content - The content to edit
   * @param {number} version - The version number
   * @param {any} trackDebriefRow - The track debrief row object
   * @returns {void}
   */
  openMarkdownDialogForTrackDebrief(
    content: any,
    version: number,
    trackDebriefRow: any
  ): void {
    const track = trackDebriefRow.Track.replace(/\s+/g, '_');
    const dialogRef = this.dialog.open(MarkdownEditorDialogComponent, {
      data: {
        initialText: JSON.stringify(content, null, 2),
        eventName: this.selectedEvent,
        selected_session: track,
        selectedSessionType: '',
        selectedReportType: 'track_debrief',
        version: version,
        readOnly: false,
      } as MarkdownEditorData,
      width: '1000px',
      maxWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.edited) {
        // Refresh the track debrief list to reflect any changes
        this.generateUniqueTracksData();
      }
    });
  }

  /**
   * Generates daily debriefs for selected items via checkboxes.
   * Requires checkbox selection to proceed.
   * @returns {void}
   */
  openGenerateDailyDebriefDialog(): void {
    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    // Require checkbox selection
    if (this.selectedDailyDebriefs.size === 0) {
      this.displayErrorMessage(
        'Please select at least one daily debrief to generate.'
      );
      return;
    }

    // Generate for selected items
    this.generateSelectedDailyDebriefs();
  }

  /**
   * Generates daily debriefs for selected items based on checkbox selection.
   * @returns {void}
   */
  private generateSelectedDailyDebriefs(): void {
    if (this.selectedDailyDebriefs.size === 0) {
      this.displayErrorMessage(
        'Please select at least one daily debrief to generate.'
      );
      return;
    }

    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    // Find the event config to get the domain
    const eventConfig = this.events.find(
      (e: EventConfig) => e.EventIdentifier === this.selectedEvent
    );

    // Get EventDomain from Information property, fallback to Domain if not available
    const eventDomain =
      eventConfig?.['Information']?.['EventDomain'] || eventConfig?.Domain;

    if (!eventConfig || !eventDomain) {
      this.displayErrorMessage(
        'Event domain not found. Cannot generate daily debrief.'
      );
      return;
    }

    // Convert Set to Array
    const selectedEventDays = Array.from(this.selectedDailyDebriefs);
    this.generateDailyDebriefs(selectedEventDays, eventDomain);
  }

  /**
   * Generates multiple daily debriefs by calling the API endpoint via the backend service.
   * @param {string[]} eventDays - Array of selected event days (e.g., ["Day 1", "Day 2"])
   * @param {string} domain - The domain associated with the event
   * @returns {void}
   */
  private generateDailyDebriefs(eventDays: string[], domain: string): void {
    if (!eventDays || eventDays.length === 0) {
      return;
    }

    // Show loading dialog
    const loadingDialogRef: MatDialogRef<LoadingDialogComponent> =
      this.dialog.open(LoadingDialogComponent, {
        disableClose: true,
        data: { message: `Generating ${eventDays.length} daily debrief(s)...` },
      });

    // Generate debriefs for all selected event days
    const debriefObservables = eventDays.map((eventDay) =>
      this._backendApiService.generateDailyDebrief({
        eventName: this.selectedEvent,
        domain: domain,
        debriefFilter: eventDay,
        screenTimeout: 60,
      })
    );

    // Use forkJoin to execute all requests in parallel
    forkJoin(debriefObservables).subscribe({
      next: (responses: any[]) => {
        loadingDialogRef.close();
        console.log('Daily debrief generation responses:', responses);
        const successCount = responses.length;
        this.displaySuccessMessage(
          `Daily debrief generation started for ${successCount} event day(s). Please check back later.`
        );
        // Optionally refresh the sessions list after a delay
        setTimeout(() => {
          this.getSessionsForEvent(this.selectedEvent);
        }, 2000);
      },
      error: (error) => {
        loadingDialogRef.close();
        console.error('Error generating daily debriefs:', error);
        const errorMessage =
          error.error?.message ||
          error.message ||
          'Failed to generate some daily debriefs. Please try again.';
        this.displayErrorMessage(errorMessage);
      },
    });
  }

  /**
   * Generates track debriefs for selected items via checkboxes.
   * Requires checkbox selection to proceed.
   * @returns {void}
   */
  openGenerateTrackDebriefDialog(): void {
    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    // Require checkbox selection
    if (this.selectedTrackDebriefs.size === 0) {
      this.displayErrorMessage(
        'Please select at least one track debrief to generate.'
      );
      return;
    }

    // Generate for selected items
    this.generateSelectedTrackDebriefs();
  }

  /**
   * Generates track debriefs for selected items based on checkbox selection.
   * @returns {void}
   */
  private generateSelectedTrackDebriefs(): void {
    if (this.selectedTrackDebriefs.size === 0) {
      this.displayErrorMessage(
        'Please select at least one track debrief to generate.'
      );
      return;
    }

    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    // Find the event config to get the domain
    const eventConfig = this.events.find(
      (e: EventConfig) => e.EventIdentifier === this.selectedEvent
    );

    // Get EventDomain from Information property, fallback to Domain if not available
    const eventDomain =
      eventConfig?.['Information']?.['EventDomain'] || eventConfig?.Domain;

    if (!eventConfig || !eventDomain) {
      this.displayErrorMessage(
        'Event domain not found. Cannot generate track debrief.'
      );
      return;
    }

    // Convert Set to Array
    const selectedTracks = Array.from(this.selectedTrackDebriefs);
    this.generateTrackDebriefs(selectedTracks, eventDomain);
  }

  /**
   * Generates multiple track debriefs by calling the API endpoint via the backend service.
   * @param {string[]} tracks - Array of selected track names
   * @param {string} domain - The domain associated with the event
   * @returns {void}
   */
  private generateTrackDebriefs(tracks: string[], domain: string): void {
    if (!tracks || tracks.length === 0) {
      return;
    }

    // Show loading dialog
    const loadingDialogRef: MatDialogRef<LoadingDialogComponent> =
      this.dialog.open(LoadingDialogComponent, {
        disableClose: true,
        data: { message: `Generating ${tracks.length} track debrief(s)...` },
      });

    // Generate debriefs for all selected tracks
    const debriefObservables = tracks.map((track) =>
      this._backendApiService.generateTrackDebrief({
        eventName: this.selectedEvent,
        domain: domain,
        debriefFilter: track,
        screenTimeout: 60,
      })
    );

    // Use forkJoin to execute all requests in parallel
    forkJoin(debriefObservables).subscribe({
      next: (responses: any[]) => {
        loadingDialogRef.close();
        console.log('Track debrief generation responses:', responses);
        const successCount = responses.length;
        this.displaySuccessMessage(
          `Track debrief generation started for ${successCount} track(s). Please check back later.`
        );
        // Optionally refresh the sessions list after a delay
        setTimeout(() => {
          this.getSessionsForEvent(this.selectedEvent);
        }, 2000);
      },
      error: (error) => {
        loadingDialogRef.close();
        console.error('Error generating track debriefs:', error);
        const errorMessage =
          error.error?.message ||
          error.message ||
          'Failed to generate some track debriefs. Please try again.';
        this.displayErrorMessage(errorMessage);
      },
    });
  }

  /**
   * Gets the latest PDF paths for an executive summary.
   * @param {string} executiveSummaryId - The executive summary identifier (e.g., "ExecSummary")
   * @returns {any} Object with pdfPathV1, pdfPathV2, and version
   * @private
   */
  private getLatestPdfPathsForExecutiveSummary(
    executiveSummaryId: string
  ): any {
    if (!this.selectedEvent || !this.contentVersions || !executiveSummaryId) {
      return null;
    }

    // Create contentIdentifier in format: "Event Name | Executive Summary ID"
    const contentIdentifier = `${this.selectedEvent}|${executiveSummaryId}`;

    // Filter versions by contentIdentifier and reportType (executive_summary)
    // Use lowercase comparison on both sides for case-insensitive matching
    const matchingVersions = this.contentVersions.filter(
      (version: any) =>
        version.contentIdentifier?.toLowerCase() ===
          contentIdentifier.toLowerCase() &&
        version.reportType === 'executive_summary'
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
    // Handle both camelCase and snake_case field names, and trim whitespace
    const pdfPathV1 = (
      latestVersion.pdfPathV1 ||
      latestVersion.pdf_path_v1 ||
      ''
    ).trim();
    const pdfPathV2 = (
      latestVersion.pdfPathV2 ||
      latestVersion.pdf_path_v2 ||
      ''
    ).trim();

    return {
      pdfPathV1: pdfPathV1 || '',
      pdfPathV2: pdfPathV2 || '',
      version: latestVersion.version || 0,
    };
  }

  /**
   * Generates executive summary data for the Executive Summary table.
   * Gets PDF information from content-versions API filtered by contentIdentifier
   * @private
   * @returns {void}
   */
  private generateExecutiveSummaryData(): void {
    if (!this.selectedEvent) {
      this.executiveSummaryDataSource = new MatTableDataSource([]);
      return;
    }

    const executiveSummaryId = 'ExecSummary';
    const pdfPaths =
      this.getLatestPdfPathsForExecutiveSummary(executiveSummaryId);

    const executiveSummaryData: any[] = [];
    if (pdfPaths && pdfPaths.version > 0) {
      executiveSummaryData.push({
        executiveSummaryId: executiveSummaryId,
        pdfPathV1: pdfPaths?.pdfPathV1 || '',
        pdfPathV2: pdfPaths?.pdfPathV2 || '',
        version: pdfPaths?.version || 0,
        reportUrl: '', // Will be populated from eventReportDetails
      });
    }

    // Update the executive summary data source
    this.executiveSummaryDataSource = new MatTableDataSource(
      executiveSummaryData
    );
    setTimeout(() => {
      this.executiveSummaryDataSource.sort = this.sort;
      if (this.paginator) {
        this.executiveSummaryDataSource.paginator = this.paginator;
      }
    }, 100);
  }

  /**
   * Generates executive summary by calling the API with all available event days.
   * No dialog is opened - it automatically uses all uniqueDays.
   * @returns {void}
   */
  openGenerateExecutiveSummaryDialog(): void {
    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    if (!this.uniqueDays || this.uniqueDays.length === 0) {
      this.displayErrorMessage(
        'No event days available. Please load sessions first.'
      );
      return;
    }

    // Find the event config to get the domain and title
    const eventConfig = this.events.find(
      (e: EventConfig) => e.EventIdentifier === this.selectedEvent
    );

    if (!eventConfig) {
      this.displayErrorMessage('Event configuration not found.');
      return;
    }

    // Get event title from Information property or use EventIdentifier as fallback
    const eventTitle =
      eventConfig?.['Information']?.['EventTitle'] ||
      eventConfig?.['Information']?.['EventName'] ||
      this.selectedEvent;

    // Use all available uniqueDays directly without opening a dialog
    this.generateExecutiveSummary(this.uniqueDays, eventTitle);
  }

  /**
   * Generates executive summary by calling the API endpoint via the backend service.
   * @param {string[]} eventDays - Array of selected event days (e.g., ["Day 1", "Day 2"])
   * @param {string} eventTitle - The event title
   * @returns {void}
   */
  private generateExecutiveSummary(
    eventDays: string[],
    eventTitle: string
  ): void {
    if (!eventDays || eventDays.length === 0) {
      return;
    }

    // Show loading dialog
    const loadingDialogRef: MatDialogRef<LoadingDialogComponent> =
      this.dialog.open(LoadingDialogComponent, {
        disableClose: true,
        data: { message: 'Generating executive summary...' },
      });

    // Convert event days to the format expected by the API (e.g., "Day 1" -> "Day_1")
    const reports = eventDays.map((day) => ({
      daily_debrief_id: day.replace(/\s+/g, '_'),
      report_type: 'daily_debrief',
    }));

    const requestData = {
      event_id: this.selectedEvent,
      event_title: eventTitle,
      executive_summary_id: 'ExecSummary',
      reports: reports,
    };

    this._backendApiService.generateExecutiveSummary(requestData).subscribe({
      next: (response: any) => {
        loadingDialogRef.close();
        console.log('Executive summary generation response:', response);
        this.displaySuccessMessage(
          'Executive summary generation started. Please check back later.'
        );
        // Optionally refresh the sessions list after a delay
        setTimeout(() => {
          this.getSessionsForEvent(this.selectedEvent);
        }, 2000);
      },
      error: (error) => {
        loadingDialogRef.close();
        console.error('Error generating executive summary:', error);
        const errorMessage =
          error.error?.message ||
          error.message ||
          'Failed to generate executive summary. Please try again.';
        this.displayErrorMessage(errorMessage);
      },
    });
  }

  /**
   * Views PDF V2 for executive summary.
   * @param {any} executiveSummaryRow - The executive summary row object
   * @returns {void}
   */
  viewPdfV2ForExecutiveSummary(executiveSummaryRow: any): void {
    if (
      !executiveSummaryRow.executiveSummaryId ||
      !executiveSummaryRow.pdfPathV2
    ) {
      this.displayErrorMessage(
        'PDF V2 not available for this executive summary.'
      );
      return;
    }

    const pdfPaths = this.getLatestPdfPathsForExecutiveSummary(
      executiveSummaryRow.executiveSummaryId
    );
    if (!pdfPaths || !pdfPaths.pdfPathV2) {
      this.displayErrorMessage(
        'PDF V2 not available for this executive summary.'
      );
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    // Create contentIdentifier in format: "Event Name | Executive Summary ID"
    const contentIdentifier = `${this.selectedEvent}|${executiveSummaryRow.executiveSummaryId}`;
    const reportType = 'executive_summary';
    const data = {
      eventId: this.selectedEvent,
      briefId: contentIdentifier,
      reportType: reportType,
      version: executiveSummaryRow.version,
      promptVersion: 'v2',
    };

    this._backendApiService.getSignedPdfUrl(data).subscribe({
      next: (response: any) => {
        dialogRef.close();
        console.log(response['presignedUrl']);
        if (response?.presignedUrl) {
          window.open(response.presignedUrl, '_blank');
        } else if (response?.url) {
          window.open(response.url, '_blank');
        } else {
          this.displayErrorMessage('Failed to generate PDF URL.');
        }
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error getting presigned URL:', error);
        this.displayErrorMessage('Failed to open PDF. Please try again.');
      },
    });
  }

  /**
   * Edits the content (JSON) for an executive summary.
   * @param {any} executiveSummaryRow - The executive summary row object with version properties
   * @returns {void}
   */
  editContentForExecutiveSummary(executiveSummaryRow: any): void {
    if (
      !executiveSummaryRow.executiveSummaryId ||
      !executiveSummaryRow.version
    ) {
      this.displayErrorMessage(
        'No version available for this executive summary.'
      );
      return;
    }

    // Open loading dialog
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Loading content for editing...' },
      }
    );

    // Create contentIdentifier in format: "Event Name | Executive Summary ID"
    const contentIdentifier = `${this.selectedEvent}|${executiveSummaryRow.executiveSummaryId}`;
    const data = {
      eventId: this.selectedEvent,
      briefId: contentIdentifier,
      reportType: 'executive_summary',
      version: executiveSummaryRow.version,
    };

    this._backendApiService.getVersionContent(data).subscribe({
      next: (response) => {
        dialogRef.close();
        this.openMarkdownDialogForExecutiveSummary(
          response,
          executiveSummaryRow.version,
          executiveSummaryRow
        );
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching version content:', error);
        this.displayErrorMessage(
          'Failed to load content for editing. Please try again.'
        );
      },
    });
  }

  /**
   * Opens the markdown editor dialog for editing executive summary content.
   * @param {any} content - The content to edit
   * @param {number} version - The version number
   * @param {any} executiveSummaryRow - The executive summary row object
   * @returns {void}
   */
  openMarkdownDialogForExecutiveSummary(
    content: any,
    version: number,
    executiveSummaryRow: any
  ): void {
    // Create contentIdentifier in format: "Event Name | Executive Summary ID"
    const dialogRef = this.dialog.open(MarkdownEditorDialogComponent, {
      data: {
        initialText: JSON.stringify(content, null, 2),
        eventName: this.selectedEvent,
        selected_session: executiveSummaryRow.executiveSummaryId,
        selectedSessionType: '',
        selectedReportType: 'executive_summary',
        version: version,
        readOnly: false,
        briefId: 'ExecSummary',
      } as MarkdownEditorData,
      width: '1000px',
      maxWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.edited) {
        // Refresh the executive summary list to reflect any changes
        this.generateExecutiveSummaryData();
      }
    });
  }

  /**
   * Toggles the selection of a daily debrief.
   * @param {string} eventDay - The event day identifier
   * @param {boolean} checked - Whether the checkbox is checked
   * @returns {void}
   */
  onDailyDebriefToggle(eventDay: string, checked: boolean): void {
    if (checked) {
      this.selectedDailyDebriefs.add(eventDay);
    } else {
      this.selectedDailyDebriefs.delete(eventDay);
    }
  }

  /**
   * Checks if a daily debrief is selected.
   * @param {string} eventDay - The event day identifier
   * @returns {boolean} True if selected, false otherwise
   */
  isDailyDebriefSelected(eventDay: string): boolean {
    return this.selectedDailyDebriefs.has(eventDay);
  }

  /**
   * Checks if all daily debriefs are selected.
   * @returns {boolean} True if all are selected, false otherwise
   */
  isAllDailyDebriefsSelected(): boolean {
    const filteredData =
      this.dailyDebriefDataSource.filteredData ||
      this.dailyDebriefDataSource.data ||
      [];
    return (
      filteredData.length > 0 &&
      filteredData.every((row: any) =>
        this.selectedDailyDebriefs.has(row.EventDay)
      )
    );
  }

  /**
   * Checks if the daily debrief select-all checkbox should be in an indeterminate state.
   * @returns {boolean} True if some are selected, false otherwise
   */
  isDailyDebriefIndeterminate(): boolean {
    const filteredData =
      this.dailyDebriefDataSource.filteredData ||
      this.dailyDebriefDataSource.data ||
      [];
    const selectedCount = filteredData.filter((row: any) =>
      this.selectedDailyDebriefs.has(row.EventDay)
    ).length;
    return selectedCount > 0 && selectedCount < filteredData.length;
  }

  /**
   * Toggles the selection of all daily debriefs.
   * @param {boolean} checked - Whether to select or deselect all
   * @returns {void}
   */
  toggleAllDailyDebriefs(checked: boolean): void {
    const filteredData =
      this.dailyDebriefDataSource.filteredData ||
      this.dailyDebriefDataSource.data ||
      [];
    if (checked) {
      filteredData.forEach((row: any) => {
        if (row.version) {
          this.selectedDailyDebriefs.add(row.EventDay);
        }
      });
    } else {
      filteredData.forEach((row: any) => {
        this.selectedDailyDebriefs.delete(row.EventDay);
      });
    }
  }

  /**
   * Publishes all selected daily debrief reports.
   * @returns {void}
   */
  publishDailyDebrief(): void {
    if (this.selectedDailyDebriefs.size === 0) {
      this.displayErrorMessage(
        'Please select at least one daily debrief to publish.'
      );
      return;
    }

    const filteredData =
      this.dailyDebriefDataSource.filteredData ||
      this.dailyDebriefDataSource.data ||
      [];
    const selectedRows = filteredData.filter((row: any) => {
      const hasPdfV2 =
        row.pdfPathV2 &&
        (typeof row.pdfPathV2 === 'string'
          ? row.pdfPathV2.trim().length > 0
          : row.pdfPathV2);
      return (
        this.selectedDailyDebriefs.has(row.EventDay) && row.version && hasPdfV2
      );
    });

    if (selectedRows.length === 0) {
      this.displayErrorMessage(
        'No daily debriefs with PDF V2 available to publish. Please ensure PDF V2 is generated for the selected items.'
      );
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: {
          message: `Publishing ${selectedRows.length} daily debrief report(s)...`,
        },
      }
    );

    const publishObservables = selectedRows.map((row: any) => {
      const dailyDebriefId =
        row._dailyDebriefId || row.EventDay.replace(/\s+/g, '_');
      const contentIdentifier = `${this.selectedEvent}|${dailyDebriefId}`;

      return this._backendApiService
        .publishDebriefReport({
          reportType: 'daily_debrief',
          contentIdentifier: contentIdentifier,
          version: row.version,
        })
        .pipe(
          catchError((error) => {
            console.error(
              `Error publishing daily debrief for ${row.EventDay}:`,
              error
            );
            return of({
              error: true,
              eventDay: row.EventDay,
              errorMessage: error,
            });
          })
        );
    });

    forkJoin(publishObservables).subscribe({
      next: (responses) => {
        console.log('All daily debriefs published:', responses);
        dialogRef.close();

        const successful = responses.filter((r: any) => !r.error).length;
        const failed = responses.filter((r: any) => r.error).length;

        if (failed === 0) {
          this.displaySuccessMessage(
            `Successfully published ${successful} daily debrief report(s)!`
          );
        } else {
          this.snackBar.open(
            `Published ${successful} daily debrief(s) successfully. ${failed} failed.`,
            'Close',
            {
              duration: 7000,
              panelClass: ['snackbar-error'],
            }
          );
        }

        // Clear selections and refresh data
        this.selectedDailyDebriefs.clear();
        this.getSessionsForEvent(this.selectedEvent);
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error publishing daily debriefs:', error);
        this.displayErrorMessage(
          'Failed to publish some daily debrief reports. Please try again.'
        );
      },
    });
  }

  /**
   * Toggles the selection of a track debrief.
   * @param {string} track - The track name
   * @param {boolean} checked - Whether the checkbox is checked
   * @returns {void}
   */
  onTrackDebriefToggle(track: string, checked: boolean): void {
    if (checked) {
      this.selectedTrackDebriefs.add(track);
    } else {
      this.selectedTrackDebriefs.delete(track);
    }
  }

  /**
   * Checks if a track debrief is selected.
   * @param {string} track - The track name
   * @returns {boolean} True if selected, false otherwise
   */
  isTrackDebriefSelected(track: string): boolean {
    return this.selectedTrackDebriefs.has(track);
  }

  /**
   * Checks if all track debriefs are selected.
   * @returns {boolean} True if all are selected, false otherwise
   */
  isAllTrackDebriefsSelected(): boolean {
    const filteredData =
      this.trackDebriefDataSource.filteredData ||
      this.trackDebriefDataSource.data ||
      [];
    return (
      filteredData.length > 0 &&
      filteredData.every((row: any) =>
        this.selectedTrackDebriefs.has(row.Track)
      )
    );
  }

  /**
   * Checks if the track debrief select-all checkbox should be in an indeterminate state.
   * @returns {boolean} True if some are selected, false otherwise
   */
  isTrackDebriefIndeterminate(): boolean {
    const filteredData =
      this.trackDebriefDataSource.filteredData ||
      this.trackDebriefDataSource.data ||
      [];
    const selectedCount = filteredData.filter((row: any) =>
      this.selectedTrackDebriefs.has(row.Track)
    ).length;
    return selectedCount > 0 && selectedCount < filteredData.length;
  }

  /**
   * Toggles the selection of all track debriefs.
   * @param {boolean} checked - Whether to select or deselect all
   * @returns {void}
   */
  toggleAllTrackDebriefs(checked: boolean): void {
    const filteredData =
      this.trackDebriefDataSource.filteredData ||
      this.trackDebriefDataSource.data ||
      [];
    if (checked) {
      filteredData.forEach((row: any) => {
        if (row.version) {
          this.selectedTrackDebriefs.add(row.Track);
        }
      });
    } else {
      filteredData.forEach((row: any) => {
        this.selectedTrackDebriefs.delete(row.Track);
      });
    }
  }

  /**
   * Publishes all selected track debrief reports.
   * @returns {void}
   */
  publishTrackDebrief(): void {
    if (this.selectedTrackDebriefs.size === 0) {
      this.displayErrorMessage(
        'Please select at least one track debrief to publish.'
      );
      return;
    }

    const filteredData =
      this.trackDebriefDataSource.filteredData ||
      this.trackDebriefDataSource.data ||
      [];
    const selectedRows = filteredData.filter((row: any) => {
      const hasPdfV2 =
        row.pdfPathV2 &&
        (typeof row.pdfPathV2 === 'string'
          ? row.pdfPathV2.trim().length > 0
          : row.pdfPathV2);
      return (
        this.selectedTrackDebriefs.has(row.Track) && row.version && hasPdfV2
      );
    });

    if (selectedRows.length === 0) {
      this.displayErrorMessage(
        'No track debriefs with PDF V2 available to publish. Please ensure PDF V2 is generated for the selected items.'
      );
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: {
          message: `Publishing ${selectedRows.length} track debrief report(s)...`,
        },
      }
    );

    const publishObservables = selectedRows.map((row: any) => {
      const track = row.Track.replace(/\s+/g, '_');
      const contentIdentifier = `${this.selectedEvent}|${track}`;

      return this._backendApiService
        .publishDebriefReport({
          reportType: 'track_debrief',
          contentIdentifier: contentIdentifier,
          version: row.version,
        })
        .pipe(
          catchError((error) => {
            console.error(
              `Error publishing track debrief for ${row.Track}:`,
              error
            );
            return of({
              error: true,
              track: row.Track,
              errorMessage: error,
            });
          })
        );
    });

    forkJoin(publishObservables).subscribe({
      next: (responses) => {
        console.log('All track debriefs published:', responses);
        dialogRef.close();

        const successful = responses.filter((r: any) => !r.error).length;
        const failed = responses.filter((r: any) => r.error).length;

        if (failed === 0) {
          this.displaySuccessMessage(
            `Successfully published ${successful} track debrief report(s)!`
          );
        } else {
          this.snackBar.open(
            `Published ${successful} track debrief(s) successfully. ${failed} failed.`,
            'Close',
            {
              duration: 7000,
              panelClass: ['snackbar-error'],
            }
          );
        }

        // Clear selections and refresh data
        this.selectedTrackDebriefs.clear();
        this.getSessionsForEvent(this.selectedEvent);
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error publishing track debriefs:', error);
        this.displayErrorMessage(
          'Failed to publish some track debrief reports. Please try again.'
        );
      },
    });
  }

  /**
   * Toggles the selection of an executive summary.
   * @param {string} executiveSummaryId - The executive summary identifier
   * @param {boolean} checked - Whether the checkbox is checked
   * @returns {void}
   */
  onExecutiveSummaryToggle(executiveSummaryId: string, checked: boolean): void {
    if (checked) {
      this.selectedExecutiveSummaries.add(executiveSummaryId);
    } else {
      this.selectedExecutiveSummaries.delete(executiveSummaryId);
    }
  }

  /**
   * Checks if an executive summary is selected.
   * @param {string} executiveSummaryId - The executive summary identifier
   * @returns {boolean} True if selected, false otherwise
   */
  isExecutiveSummarySelected(executiveSummaryId: string): boolean {
    return this.selectedExecutiveSummaries.has(executiveSummaryId);
  }

  /**
   * Checks if all executive summaries are selected.
   * @returns {boolean} True if all are selected, false otherwise
   */
  isAllExecutiveSummariesSelected(): boolean {
    const filteredData =
      this.executiveSummaryDataSource.filteredData ||
      this.executiveSummaryDataSource.data ||
      [];
    return (
      filteredData.length > 0 &&
      filteredData.every((row: any) =>
        this.selectedExecutiveSummaries.has(row.executiveSummaryId)
      )
    );
  }

  /**
   * Checks if the executive summary select-all checkbox should be in an indeterminate state.
   * @returns {boolean} True if some are selected, false otherwise
   */
  isExecutiveSummaryIndeterminate(): boolean {
    const filteredData =
      this.executiveSummaryDataSource.filteredData ||
      this.executiveSummaryDataSource.data ||
      [];
    const selectedCount = filteredData.filter((row: any) =>
      this.selectedExecutiveSummaries.has(row.executiveSummaryId)
    ).length;
    return selectedCount > 0 && selectedCount < filteredData.length;
  }

  /**
   * Toggles the selection of all executive summaries.
   * @param {boolean} checked - Whether to select or deselect all
   * @returns {void}
   */
  toggleAllExecutiveSummaries(checked: boolean): void {
    const filteredData =
      this.executiveSummaryDataSource.filteredData ||
      this.executiveSummaryDataSource.data ||
      [];
    if (checked) {
      filteredData.forEach((row: any) => {
        if (row.version) {
          this.selectedExecutiveSummaries.add(row.executiveSummaryId);
        }
      });
    } else {
      filteredData.forEach((row: any) => {
        this.selectedExecutiveSummaries.delete(row.executiveSummaryId);
      });
    }
  }

  /**
   * Publishes all selected executive summary reports.
   * @returns {void}
   */
  publishExecutiveSummary(): void {
    const filteredData =
      this.executiveSummaryDataSource.filteredData ||
      this.executiveSummaryDataSource.data ||
      [];
    const rowsToPublish = filteredData.filter((row: any) => {
      const hasPdfV2 =
        row.pdfPathV2 &&
        (typeof row.pdfPathV2 === 'string'
          ? row.pdfPathV2.trim().length > 0
          : row.pdfPathV2);
      return row.version && hasPdfV2;
    });

    if (rowsToPublish.length === 0) {
      this.displayErrorMessage(
        'No executive summaries with PDF V2 available to publish.'
      );
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: {
          message: `Publishing ${rowsToPublish.length} executive summary report(s)...`,
        },
      }
    );

    const publishObservables = rowsToPublish.map((row: any) => {
      const contentIdentifier = `${this.selectedEvent}|${row.executiveSummaryId}`;

      return this._backendApiService
        .publishDebriefReport({
          reportType: 'executive_summary',
          contentIdentifier: contentIdentifier,
          version: row.version,
        })
        .pipe(
          catchError((error) => {
            console.error(
              `Error publishing executive summary for ${row.executiveSummaryId}:`,
              error
            );
            return of({
              error: true,
              executiveSummaryId: row.executiveSummaryId,
              errorMessage: error,
            });
          })
        );
    });

    forkJoin(publishObservables).subscribe({
      next: (responses) => {
        console.log('All executive summaries published:', responses);
        dialogRef.close();

        const successful = responses.filter((r: any) => !r.error).length;
        const failed = responses.filter((r: any) => r.error).length;

        if (failed === 0) {
          this.displaySuccessMessage(
            `Successfully published ${successful} executive summary report(s)!`
          );
        } else {
          this.snackBar.open(
            `Published ${successful} executive summary(s) successfully. ${failed} failed.`,
            'Close',
            {
              duration: 7000,
              panelClass: ['snackbar-error'],
            }
          );
        }

        // Clear selections and refresh data
        this.selectedExecutiveSummaries.clear();
        this.getSessionsForEvent(this.selectedEvent);
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error publishing executive summaries:', error);
        this.displayErrorMessage(
          'Failed to publish some executive summary reports. Please try again.'
        );
      },
    });
  }

  /**
   * Handles manual upload of publish report PDF for executive summary.
   * @param {Object} data - The upload data containing file and eventId
   * @param {File} data.file - The PDF file to upload
   * @param {string} data.eventId - The event identifier
   * @returns {void}
   */
  onUploadManualPublishReport(data: { file: File; eventId?: string }): void {
    if (!data.file) {
      this.displayErrorMessage('Please select a file to upload.');
      return;
    }

    // Use selectedEvent from parent if eventId is not provided
    const eventId = data.eventId || this.selectedEvent;

    if (!eventId) {
      this.displayErrorMessage(
        'Event ID is required for upload. Please select an event first.'
      );
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: {
          message: 'Uploading manual publish report...',
        },
      }
    );

    // Upload file via Lambda endpoint (avoids CORS issues)
    this._backendApiService
      .uploadManualExecutiveSummary(eventId, data.file)
      .pipe(
        catchError((error) => {
          dialogRef.close();
          console.error('Error uploading file:', error);
          this.displayErrorMessage('Failed to upload file. Please try again.');
          return of(null);
        })
      )
      .subscribe((uploadResponse: any) => {
        if (uploadResponse) {
          dialogRef.close();
          this.displaySuccessMessage(
            'Manual publish report uploaded successfully!'
          );
          // Refresh the data to show the updated publish PDF
          setTimeout(() => {
            this.getSessionsForEvent(this.selectedEvent);
          }, 1000);
        }
      });
  }

  /**
   * Displays a success message using the snackbar.
   * @param {string} message - The success message to display
   * @returns {void}
   */
  private displaySuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  viewPdfV2ForOtherBrief(session: Session): void {
    const pdfPaths = this.getLatestPdfPathsForOtherBrief(session);
    if (!pdfPaths || !pdfPaths.pdfPathV2) {
      this.displayErrorMessage('PDF V2 not available for this brief type.');
      return;
    }

    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Opening PDF...' },
      }
    );

    const reportType =
      this.briefFilterMode === 'daily_debrief'
        ? 'daily_brief'
        : 'track_debrief';
    // For track_debrief, do not pass sessionId and sessionType
    const data: any = {
      eventId: this.selectedEvent,
      reportType: reportType,
      version: pdfPaths.version || 0,
      promptVersion: 'v2',
    };

    // Only include sessionId and sessionType for daily_brief
    if (this.briefFilterMode === 'daily_debrief') {
      data.sessionId = session.SessionId;
      data.sessionType = ''; // Empty string to ignore sessionType filter
    }

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
   * Handles the toggle of a session checkbox.
   * Adds or removes the session from the selectedSessions set.
   * @param {string} sessionId - The identifier of the session
   * @param {boolean} checked - Whether the checkbox is checked
   * @returns {void}
   */
  onSessionToggle(sessionId: string, checked: boolean): void {
    if (checked) {
      this.selectedSessions.add(sessionId);
    } else {
      this.selectedSessions.delete(sessionId);
    }
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

    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  /**
   * Selects checkboxes from "from" index to "to" index in the filtered sessions list.
   * The indices are 1-based (first item is index 1).
   * Clears all previous selections before selecting the new range.
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
      this.displayErrorMessage(
        'Please enter valid numbers for From and To indices.'
      );
      return;
    }

    const filteredSessions = this.getFilteredSessions();

    if (filteredSessions.length === 0) {
      this.displayErrorMessage('No sessions available to select.');
      return;
    }

    // Clear all previous checkbox selections
    this.selectedSessions.clear();

    // Convert to 0-based indices and ensure they're within bounds
    const from = Math.max(1, Math.min(fromNum, filteredSessions.length)) - 1;
    const to = Math.max(1, Math.min(toNum, filteredSessions.length)) - 1;

    // Ensure from is less than or equal to to
    const startIndex = Math.min(from, to);
    const endIndex = Math.max(from, to);

    // Select all sessions in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const session = filteredSessions[i];
      if (session && session.SessionId) {
        this.selectedSessions.add(session.SessionId);
      }
    }

    // Clear the input fields after selection
    this.fromIndex = null;
    this.toIndex = null;

    // Trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Handles the range input change for track debrief.
   * @param {string} field - Either 'from' or 'to'
   * @param {Event} event - The input event
   * @returns {void}
   */
  onTrackDebriefRangeInputChange(field: 'from' | 'to', event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');

    // Update the model with only numeric characters
    if (field === 'from') {
      this.fromTrackIndex = numericValue || null;

      // Auto-calculate 'to' as 'from + 49' when 'from' changes
      if (numericValue && numericValue.trim() !== '') {
        const fromNum = parseInt(numericValue, 10);
        if (!isNaN(fromNum)) {
          const calculatedTo = (fromNum + 49).toString();
          this.toTrackIndex = calculatedTo;
        }
      } else {
        // If 'from' is cleared, also clear 'to'
        this.toTrackIndex = null;
      }
    } else {
      // User is manually editing 'to', so just update it
      this.toTrackIndex = numericValue || null;
    }

    // Update the input value directly to reflect the change
    input.value = numericValue;

    // Trigger change detection to update the view
    this.cdr.detectChanges();
  }

  /**
   * Selects checkboxes from "from" index to "to" index in the filtered track debriefs list.
   * The indices are 1-based (first item is index 1).
   * Clears all previous selections before selecting the new range.
   * @returns {void}
   */
  selectTrackDebriefRange(): void {
    if (
      this.fromTrackIndex === null ||
      this.toTrackIndex === null ||
      this.fromTrackIndex.trim() === '' ||
      this.toTrackIndex.trim() === ''
    ) {
      return;
    }

    // Convert string inputs to numbers
    const fromNum = parseInt(this.fromTrackIndex.trim(), 10);
    const toNum = parseInt(this.toTrackIndex.trim(), 10);

    // Validate that inputs are valid numbers
    if (isNaN(fromNum) || isNaN(toNum) || fromNum < 1 || toNum < 1) {
      this.displayErrorMessage(
        'Please enter valid numbers for From and To indices.'
      );
      return;
    }

    const filteredTrackDebriefs = this.getFilteredTrackDebriefs();

    if (filteredTrackDebriefs.length === 0) {
      this.displayErrorMessage('No track debriefs available to select.');
      return;
    }

    // Clear all previous checkbox selections
    this.selectedTrackDebriefs.clear();

    // Convert to 0-based indices and ensure they're within bounds
    const from =
      Math.max(1, Math.min(fromNum, filteredTrackDebriefs.length)) - 1;
    const to = Math.max(1, Math.min(toNum, filteredTrackDebriefs.length)) - 1;

    // Ensure from is less than or equal to to
    const startIndex = Math.min(from, to);
    const endIndex = Math.max(from, to);

    // Select all track debriefs in the range
    for (let i = startIndex; i <= endIndex; i++) {
      const trackDebrief = filteredTrackDebriefs[i];
      if (trackDebrief && trackDebrief.Track) {
        this.selectedTrackDebriefs.add(trackDebrief.Track);
      }
    }

    // Clear the input fields after selection
    this.fromTrackIndex = null;
    this.toTrackIndex = null;

    // Trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Checks if a session is currently selected.
   * @param {string} sessionId - The identifier of the session
   * @returns {boolean} True if the session is selected, false otherwise
   */
  isSessionSelected(sessionId: string): boolean {
    return this.selectedSessions.has(sessionId);
  }

  /**
   * Refreshes the events list and reloads sessions if an event is selected.
   * Clears all checkbox selections on refresh.
   * @returns {void}
   */
  refreshEvents(): void {
    // Clear all checkbox selections
    this.selectedSessions.clear();
    this.getEvents();
    if (this.selectedEvent) {
      this.getSessionsForEvent(this.selectedEvent);
    }
  }

  /**
   * Automatically selects default session IDs if they exist in the sessions array.
   * This method is called after sessions are loaded to pre-select specific sessions.
   * @private
   * @returns {void}
   */
  private selectDefaultSessions(): void {
    if (!this.sessions || this.sessions.length === 0) {
      return;
    }

    // Get all session IDs from the loaded sessions
    const availableSessionIds = new Set(
      this.sessions.map((session) => session.SessionId)
    );

    // Add default session IDs to selectedSessions if they exist in the loaded sessions
    this._defaultSessionIds.forEach((sessionId) => {
      if (availableSessionIds.has(sessionId)) {
        this.selectedSessions.add(sessionId);
      }
    });

    if (this.selectedSessions.size > 0) {
      console.log(
        `Auto-selected ${this.selectedSessions.size} default session(s)`
      );
    }
  }

  /**
   * Generates PDF for all selected sessions.
   * Generates PDF version 2 (latest) for each selected session in parallel.
   * Shows success/error messages and refreshes the sessions list after completion.
   * @returns {void}
   */
  generatePDF(): void {
    if (this.selectedSessions.size === 0) {
      this.displayErrorMessage(
        'Please select at least one session to generate PDF.'
      );
      return;
    }

    const selectedSessionIds = Array.from(this.selectedSessions);
    const selectedSessionsData = this.sessions.filter((session) =>
      selectedSessionIds.includes(session.SessionId)
    );

    if (selectedSessionsData.length === 0) {
      this.displayErrorMessage('No sessions selected.');
      return;
    }

    // Open loading dialog
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: {
          message: `Generating PDFs for ${selectedSessionsData.length} session(s)...`,
        },
      }
    );

    // Create array of generate PDF observables with error handling
    const generateObservables = selectedSessionsData.map((session: Session) => {
      const normalizedSessionType = this.normalizeSessionType(
        session.Type || 'primary'
      );
      // Generate PDF v2 (latest version) with error handling
      const data = {
        eventId: this.selectedEvent,
        sessionId: session.SessionId,
        sessionType: normalizedSessionType,
        reportType: 'session_debrief',
        version: session.pdfVersion || 0,
        isSinglePrompt: false,
        dailyDebriefId: '',
      };
      return this._backendApiService.generateContentPDFUrl(data);
    });

    // Use forkJoin to generate PDFs for all sessions in parallel
    forkJoin(generateObservables).subscribe({
      next: (responses) => {
        console.log('All PDFs generated:', responses);
        dialogRef.close();

        // Count successful and failed generations
        const successful = responses.filter((r: any) => !r.error).length;
        const failed = responses.filter((r: any) => r.error).length;

        if (failed === 0) {
          this.snackBar.open(
            `Successfully generated PDFs for ${successful} session(s)!`,
            'Close',
            {
              duration: 5000,
              panelClass: ['snackbar-success'],
            }
          );
        } else {
          this.snackBar.open(
            `Generated PDFs for ${successful} session(s) successfully. ${failed} session(s) failed.`,
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
        console.error('Error generating PDFs:', error);
        this.displayErrorMessage(
          'Failed to generate some PDFs. Please try again.'
        );
      },
    });
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
  publishPDF(
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
  publishReport(): void {
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
  openPublishPdf(reportUrl: string): void {
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
  openAudioPlayer(audioUrl: string): void {
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
   * Edits content for a session version.
   * Fetches the version content and opens the markdown editor dialog.
   * @param {Session | any} session - The session object with optional pdfVersion
   * @returns {void}
   */
  editContent(session: Session | any): void {
    const sessionWithVersion = session as Session & { pdfVersion?: number };
    if (!sessionWithVersion.pdfVersion) {
      this.displayErrorMessage('No PDF version available for this session.');
      return;
    }

    // Open loading dialog
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true,
        data: { message: 'Loading content for editing...' },
      }
    );

    const normalizedSessionType = this.normalizeSessionType(
      sessionWithVersion.Type || 'primary'
    );
    const data = {
      eventId: this.selectedEvent,
      sessionId: sessionWithVersion.SessionId,
      sessionType: normalizedSessionType,
      reportType: 'session_debrief',
      version: sessionWithVersion.pdfVersion!,
    };

    this._backendApiService.getVersionContent(data).subscribe({
      next: (response) => {
        dialogRef.close();
        this.openMarkdownDialog(
          response,
          sessionWithVersion.pdfVersion!,
          sessionWithVersion
        );
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching version content:', error);
        this.displayErrorMessage(
          'Failed to load content for editing. Please try again.'
        );
      },
    });
  }

  /**
   * Opens the markdown editor dialog for editing content.
   * @param {any} content - The content to edit
   * @param {number} version - The version number
   * @param {Session & { pdfVersion?: number }} session - The session object
   * @returns {void}
   */
  openMarkdownDialog(
    content: any,
    version: number,
    session: Session & { pdfVersion?: number }
  ): void {
    const normalizedSessionType = this.normalizeSessionType(
      session.Type || 'primary'
    );
    const dialogRef = this.dialog.open(MarkdownEditorDialogComponent, {
      data: {
        initialText: JSON.stringify(content, null, 2),
        eventName: this.selectedEvent,
        selected_session: session.SessionId,
        selectedSessionType: normalizedSessionType,
        selectedReportType: 'session_debrief',
        version: version,
      } as MarkdownEditorData,
      width: '1000px',
      maxWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.edited) {
        // Refresh the sessions list to reflect any changes
        this.getSessionsForEvent(this.selectedEvent);
      }
    });
  }

  /**
   * Displays an error message in a snack bar notification.
   * @param {string} message - The error message to display
   * @returns {void}
   */
  displayErrorMessage(message: string): void {
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
  filterEvents(value: string): void {
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
  onEventSelected(event: any): void {
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
  onEventInputChange(event: Event): void {
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

/**
 * AgendaComponent
 *
 * This component displays an agenda section where users can select an event from a dropdown
 * and then view sessions in a table with pagination. Clicking on a session row expands it
 * to show speakers with checkbox options.
 *
 * Main responsibilities:
 *  - Display events in a dropdown
 *  - Fetch and display sessions for selected event in a table
 *  - Show speakers when session row is expanded
 *  - Allow selection of speakers via checkboxes
 *  - Limit speaker bio functionality
 *
 * @component AgendaComponent
 * @implements {OnInit, AfterViewInit}
 */
import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit,
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { catchError, forkJoin, of } from 'rxjs';
import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import {
  Session,
  SpeakerDetails,
} from '../event-configuration/event-configuration.component';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog/delete-confirmation-dialog.component';
import { UpdateSessionDialogComponent } from './update-session-dialog/update-session-dialog.component';

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
 * Interface representing a speaker with unique identifier for tracking
 * @interface SpeakerWithId
 */
export interface SpeakerWithId extends SpeakerDetails {
  /** Unique identifier for the speaker (combination of name and session) */
  speakerId: string;
  /** Session ID where this speaker appears */
  sessionId: string;
  /** Session title where this speaker appears */
  sessionTitle: string;
}

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    TopBarComponent,
    DatePipe,
  ],
  providers: [],
})
export class AgendaComponent implements OnInit, AfterViewInit {
  /**
   * Creates an instance of AgendaComponent.
   * @param {DomSanitizer} sanitizer - Service for sanitizing HTML content
   * @param {MatSnackBar} snackBar - Service for displaying snack bar notifications
   * @param {MatIconRegistry} matIconRegistry - Registry for Material icons
   * @param {DomSanitizer} domSanitizer - Service for sanitizing DOM content
   * @param {ChangeDetectorRef} cdr - Service for manual change detection
   */
  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    console.log('AgendaComponent loaded');
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
  /** Flag indicating if bio limiting is in progress */
  public isLimitingBio: boolean = false;
  /** Flag indicating if sessions are currently being deleted */
  public isDeletingSessions: boolean = false;
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
  /** Set of selected speaker IDs (for display purposes) */
  public selectedSpeakers: Set<string> = new Set();
  /** Current text filter value */
  public textFilterValue: string = '';
  /** Number of items per page in the paginator */
  public pageSize = 10;
  /** Total number of records in the table */
  public totalRecords = 0;
  /** Index of the currently selected/highlighted row */
  public selectedRowIndex: number | null = null;
  /** Set of expanded session IDs */
  public expandedSessions: Set<string> = new Set();
  /** Array of unique event days extracted from sessions */
  public uniqueDays: string[] = [];
  /** Selected event day filter value */
  public selectedEventDay: string = '';

  /** Column definitions for the Material table */
  public displayedColumns: string[] = [
    'select',
    'startDate',
    'eventDay',
    'title',
    'sessionid',
    'status',
    'track',
    'Type',
    'totalSpeakers',
    'expand',
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
      { label: 'Agenda', active: true },
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
    // Set up custom sorting data accessor
    this.setSortingDataAccessor();
    // Set up custom filter predicate
    this.setFilterPredicate();
  }

  /**
   * Sets up the custom sorting data accessor for the data source.
   * @private
   * @returns {void}
   */
  private setSortingDataAccessor(): void {
    this.dataSource.sortingDataAccessor = (item: Session, property: string) => {
      switch (property) {
        case 'startDate':
          return item.StartsAt ? new Date(item.StartsAt).getTime() : 0;
        case 'startTime':
          return item.StartsAt ? new Date(item.StartsAt).getTime() : 0;
        case 'endTime':
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
        case 'totalSpeakers':
          return this.getSpeakerCount(item);
        default:
          return (item as any)[property];
      }
    };
  }

  /**
   * Extracts unique event days from sessions.
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
   * Handles the event day filter change.
   * @param {string} eventDay - The selected event day filter value
   * @returns {void}
   */
  onEventDayFilterChange(eventDay: string): void {
    this.selectedEventDay = eventDay;
    this.applyAllFilters();
  }

  /**
   * Sets up the custom filter predicate for the data source.
   * @private
   * @returns {void}
   */
  private setFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: Session, filter: string) => {
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

      // Event Day filter
      const eventDayMatch =
        !this.selectedEventDay || data.EventDay === this.selectedEventDay;

      return textMatch && eventDayMatch;
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
      this.selectedSpeakers.clear();
      this.expandedSessions.clear();
      this.textFilterValue = '';
      this.eventSearchInput = '';
      this.filteredEvents = this.events;
      this.totalRecords = 0;
      return;
    }

    this.selectedEvent = eventIdentifier;
    this.isLoadingSessions = true;
    this.selectedSessions.clear();
    this.selectedSpeakers.clear();
    this.expandedSessions.clear();
    this.selectedEventDay = '';
    this.uniqueDays = [];
    this.textFilterValue = '';

    this.getSessionsForEvent(eventIdentifier);
  }

  /**
   * Fetches sessions for a specific event.
   * Extracts speakers from sessions and displays them.
   * @param {string} eventIdentifier - The identifier of the event
   */
  getSessionsForEvent(eventIdentifier: string): void {
    this.isLoadingSessions = true;

    const sessionsObservable = this._backendApiService
      .getSessionsForEvent(eventIdentifier)
      .pipe(
        catchError((error) => {
          console.error('Error fetching sessions:', error);
          return of({ data: null, error: 'Failed to load sessions' });
        })
      );

    sessionsObservable.subscribe({
      next: (response: any) => {
        // Process sessions response
        const sessionsResponse = response as any;
        const data =
          sessionsResponse?.data?.eventDetails ||
          sessionsResponse?.data ||
          sessionsResponse?.eventDetails ||
          [];
        const allSessions = Array.isArray(data) ? data : [];

        this.sessions = allSessions;

        // Extract unique event days
        this.extractUniqueDays();

        // Update data source
        this.dataSource = new MatTableDataSource(this.sessions);
        this.setSortingDataAccessor();
        this.setFilterPredicate();
        this.totalRecords = this.sessions.length;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.applyAllFilters();
        }, 100);

        this.isLoadingSessions = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error in getSessionsForEvent:', error);
        this.displayErrorMessage('Failed to load data. Please try again.');
        this.sessions = [];
        this.dataSource = new MatTableDataSource([]);
        this.setSortingDataAccessor();
        this.setFilterPredicate();
        this.totalRecords = 0;
        this.isLoadingSessions = false;
        this.cdr.detectChanges();
      },
    });
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
   * Applies all active filters to the table.
   * @returns {void}
   */
  applyAllFilters(): void {
    this.dataSource.filter = 'active';
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginator.firstPage();
      this.cdr.detectChanges();
    }
  }

  /**
   * Gets the currently filtered/visible sessions from the data source.
   * @returns {Session[]} Array of filtered sessions
   */
  getFilteredSessions(): Session[] {
    return this.dataSource.filteredData || this.dataSource.data || [];
  }

  /**
   * Gets all speakers from all selected sessions.
   * @returns {SpeakerWithId[]} Array of all speakers from selected sessions
   */
  getAllSelectedSpeakers(): SpeakerWithId[] {
    const allSpeakers: SpeakerWithId[] = [];
    this.sessions.forEach((session: Session) => {
      if (session.SpeakersInfo && Array.isArray(session.SpeakersInfo)) {
        session.SpeakersInfo.forEach((speaker: SpeakerDetails) => {
          const speakerId = `${speaker.Name}_${session.SessionId}`;
          allSpeakers.push({
            ...speaker,
            speakerId: speakerId,
            sessionId: session.SessionId,
            sessionTitle: session.SessionTitle || '',
          });
        });
      }
    });
    return allSpeakers.filter((speaker) =>
      this.selectedSpeakers.has(speaker.speakerId)
    );
  }

  /**
   * Gets the count of selected sessions with speakers (for API operations).
   * Sessions with 0 speakers are excluded from API calls.
   * @returns {number} Count of selected sessions with speakers
   */
  getSelectedFilteredCount(): number {
    return this.getSelectedSessionsWithSpeakers().length;
  }

  /**
   * Gets the selected session IDs that have speakers (for API operations).
   * Sessions with 0 speakers are filtered out.
   * @returns {string[]} Array of selected session IDs with speakers
   */
  getSelectedSessionsWithSpeakers(): string[] {
    return Array.from(this.selectedSessions).filter((sessionId) => {
      const session = this.sessions.find((s) => s.SessionId === sessionId);
      return session && this.hasSpeakers(session);
    });
  }

  /**
   * Toggles the selection state of all filtered/visible sessions.
   * Shows checkboxes for all sessions, but only sessions with speakers are passed to API.
   * @param {boolean} checked - Whether to select or deselect all filtered sessions
   * @returns {void}
   */
  toggleAllSessions(checked: boolean): void {
    const filteredSessions = this.getFilteredSessions();
    if (checked) {
      filteredSessions.forEach((session) => {
        // Select all sessions (including those with 0 speakers)
        this.selectedSessions.add(session.SessionId);
      });
    } else {
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
    const selectedFilteredCount = filteredSessions.filter((session) =>
      this.selectedSessions.has(session.SessionId)
    ).length;
    return (
      selectedFilteredCount > 0 &&
      selectedFilteredCount < filteredSessions.length
    );
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
   * Checks if a session is currently selected.
   * @param {string} sessionId - The identifier of the session
   * @returns {boolean} True if the session is selected, false otherwise
   */
  isSessionSelected(sessionId: string): boolean {
    return this.selectedSessions.has(sessionId);
  }

  /**
   * Gets speakers for a specific session.
   * @param {Session} session - The session object
   * @returns {SpeakerWithId[]} Array of speakers for the session
   */
  getSpeakersForSession(session: Session): SpeakerWithId[] {
    if (!session.SpeakersInfo || !Array.isArray(session.SpeakersInfo)) {
      return [];
    }
    return session.SpeakersInfo.map((speaker: SpeakerDetails) => {
      const speakerId = `${speaker.Name}_${session.SessionId}`;
      return {
        ...speaker,
        speakerId: speakerId,
        sessionId: session.SessionId,
        sessionTitle: session.SessionTitle || '',
      };
    });
  }

  /**
   * Checks if a session has any speakers.
   * @param {Session} session - The session object
   * @returns {boolean} True if the session has speakers, false otherwise
   */
  hasSpeakers(session: Session): boolean {
    return (
      session.SpeakersInfo &&
      Array.isArray(session.SpeakersInfo) &&
      session.SpeakersInfo.length > 0
    );
  }

  /**
   * Gets the number of speakers for a session.
   * @param {Session} session - The session object
   * @returns {number} Number of speakers
   */
  getSpeakerCount(session: Session): number {
    if (!session.SpeakersInfo || !Array.isArray(session.SpeakersInfo)) {
      return 0;
    }
    return session.SpeakersInfo.length;
  }

  /**
   * Gets the total number of displayed columns.
   * @returns {number} Number of columns
   */
  getColumnCount(): number {
    return this.displayedColumns.length;
  }

  /**
   * Handles the toggle of a speaker checkbox.
   * Adds or removes the speaker from the selectedSpeakers set.
   * @param {string} speakerId - The identifier of the speaker
   * @param {boolean} checked - Whether the checkbox is checked
   * @returns {void}
   */
  onSpeakerToggle(speakerId: string, checked: boolean): void {
    if (checked) {
      this.selectedSpeakers.add(speakerId);
    } else {
      this.selectedSpeakers.delete(speakerId);
    }
  }

  /**
   * Checks if a speaker is currently selected.
   * @param {string} speakerId - The identifier of the speaker
   * @returns {boolean} True if the speaker is selected, false otherwise
   */
  isSpeakerSelected(speakerId: string): boolean {
    return this.selectedSpeakers.has(speakerId);
  }

  /**
   * Toggles the expansion state of a session row.
   * Only allows expansion if the session has speakers.
   * @param {string} sessionId - The session ID to toggle
   * @returns {void}
   */
  toggleSessionExpansion(sessionId: string): void {
    const session = this.sessions.find((s) => s.SessionId === sessionId);
    if (!session || !this.hasSpeakers(session)) {
      return;
    }

    if (this.expandedSessions.has(sessionId)) {
      this.expandedSessions.delete(sessionId);
    } else {
      this.expandedSessions.add(sessionId);
    }
  }

  /**
   * Checks if a session is expanded.
   * @param {string} sessionId - The session ID to check
   * @returns {boolean} True if the session is expanded
   */
  isSessionExpanded(sessionId: string): boolean {
    return this.expandedSessions.has(sessionId);
  }

  /**
   * Highlights a row in the table when clicked.
   * @param {Session} row - The session row that was clicked
   * @param {number} index - The index of the row in the table
   * @returns {void}
   */
  highlightRow(row: Session, index: number): void {
    this.selectedRowIndex = index;
  }

  /**
   * Limits the bio for selected sessions by calling the truncate API.
   * Truncates speaker bios to 80 words for all speakers in selected sessions.
   * Only sessions with speakers are passed to the API.
   * @returns {void}
   */
  limitBio(): void {
    const selectedSessionsWithSpeakers = this.getSelectedSessionsWithSpeakers();

    if (selectedSessionsWithSpeakers.length === 0) {
      this.displayErrorMessage(
        'Please select at least one session with speakers to limit bio.'
      );
      return;
    }

    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    if (this.isLimitingBio) {
      return; // Prevent multiple simultaneous requests
    }

    this.isLimitingBio = true;

    this._backendApiService
      .truncateSpeakerBio(this.selectedEvent, selectedSessionsWithSpeakers)
      .subscribe({
        next: (response: any) => {
          this.isLimitingBio = false;

          if (response && response.success) {
            const summary = response.summary || {};
            const message =
              `Successfully truncated bios for ${summary.successful || 0} session(s). ` +
              `Updated ${summary.totalUpdatedSpeakers || 0} speaker(s).`;

            this.snackBar.open(message, 'Close', {
              duration: 5000,
              panelClass: ['snackbar-success'],
            });

            // Refresh sessions to show updated bios
            this.getSessionsForEvent(this.selectedEvent);

            // Clear selection after successful operation
            this.selectedSessions.clear();
          } else {
            this.displayErrorMessage(
              response?.error ||
                'Failed to truncate speaker bios. Please try again.'
            );
          }
        },
        error: (error) => {
          this.isLimitingBio = false;
          console.error('Error truncating speaker bios:', error);
          this.displayErrorMessage(
            error?.error?.error ||
              error?.message ||
              'An error occurred while truncating speaker bios. Please try again.'
          );
        },
      });
  }

  /**
   * Deletes the selected sessions by filtering them out and updating the agenda.
   * All selected sessions can be deleted, regardless of speaker count.
   * @returns {void}
   */
  deleteSelectedSessions(): void {
    if (this.selectedSessions.size === 0) {
      this.displayErrorMessage('Please select at least one session to delete.');
      return;
    }

    if (!this.selectedEvent) {
      this.displayErrorMessage('Please select an event first.');
      return;
    }

    if (this.isDeletingSessions) {
      return; // Prevent multiple simultaneous requests
    }

    // Get all selected session IDs (including those with 0 speakers)
    const selectedSessionIds = Array.from(this.selectedSessions);
    const selectedCount = selectedSessionIds.length;

    const message =
      selectedCount === 1
        ? 'Are you sure you want to delete the selected session? This action cannot be undone.'
        : `Are you sure you want to delete the selected ${selectedCount} sessions? This action cannot be undone.`;

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: {
        message: message,
        count: selectedCount,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.performDelete(selectedSessionIds);
    });
  }

  /**
   * Performs the actual deletion of sessions using the deleteEvent API.
   * Deletes each session individually and tracks success/failure.
   * @param {string[]} selectedSessionIds - Array of session IDs to delete
   * @returns {void}
   */
  private performDelete(selectedSessionIds: string[]): void {
    const selectedCount = selectedSessionIds.length;
    const eventName = this.selectedEvent;

    if (!eventName) {
      this.displayErrorMessage('Event name is required for deletion.');
      return;
    }

    this.isDeletingSessions = true;

    // Create delete requests for all sessions
    const deleteRequests = selectedSessionIds.map((sessionId) =>
      this._backendApiService.deleteEvent(eventName, sessionId).pipe(
        catchError((error) => {
          console.error(`Error deleting session ${sessionId}:`, error);
          return of({
            success: false,
            sessionId: sessionId,
            error:
              error?.error?.error ||
              error?.message ||
              'Failed to delete session',
          });
        })
      )
    );

    // Execute all delete requests in parallel
    forkJoin(deleteRequests).subscribe({
      next: (responses: any[]) => {
        this.isDeletingSessions = false;

        // Count successful and failed deletions
        const successful = responses.filter((r) => r?.success !== false);
        const failed = responses.filter((r) => r?.success === false);

        if (successful.length > 0) {
          // Show success message
          const successMessage =
            successful.length === 1
              ? 'Successfully deleted 1 session.'
              : `Successfully deleted ${successful.length} session(s).`;

          this.snackBar.open(successMessage, 'Close', {
            duration: 5000,
            panelClass: ['snackbar-success'],
          });

          // Refresh sessions to reflect deletion
          this.getSessionsForEvent(this.selectedEvent);

          // Clear selection after successful deletion
          this.selectedSessions.clear();
        }

        // Show error message for failed deletions
        if (failed.length > 0) {
          const failedSessionIds = failed
            .map((f) => f.sessionId)
            .filter((id) => id)
            .join(', ');
          const errorMessage =
            failed.length === 1
              ? `Failed to delete session: ${failedSessionIds}`
              : `Failed to delete ${failed.length} session(s): ${failedSessionIds}`;

          this.displayErrorMessage(errorMessage);
        }

        // If all deletions failed, show error
        if (successful.length === 0) {
          this.displayErrorMessage(
            'Failed to delete sessions. Please try again.'
          );
        }
      },
      error: (error) => {
        this.isDeletingSessions = false;
        console.error('Error deleting sessions:', error);
        this.displayErrorMessage('Error deleting sessions. Please try again.');
      },
    });
  }

  /**
   * Refreshes the events list and reloads sessions if an event is selected.
   * Clears all checkbox selections on refresh.
   * @returns {void}
   */
  refreshEvents(): void {
    // Clear all checkbox selections
    this.selectedSessions.clear();
    this.selectedSpeakers.clear();
    this.getEvents();
    if (this.selectedEvent) {
      this.getSessionsForEvent(this.selectedEvent);
    }
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

  /**
   * Gets the speaker image URL.
   * Handles both S3FileKey and Url properties.
   * @param {SpeakerDetails} speaker - The speaker object
   * @returns {string} The image URL or empty string
   */
  getSpeakerImageUrl(speaker: SpeakerDetails): string {
    if (speaker.Url) {
      return speaker.Url;
    }
    if (speaker.S3FileKey) {
      // If S3FileKey is provided, you might need to construct the full URL
      // This depends on your S3 bucket configuration
      // For now, returning the S3FileKey as-is (backend should handle the full URL)
      return speaker.S3FileKey;
    }
    return '';
  }

  /**
   * Counts the number of words in a given text string.
   * @param {string} text - The text to count words in
   * @returns {number} The number of words in the text
   */
  getWordCount(text: string | null | undefined): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    // Remove extra whitespace and split by spaces
    const trimmedText = text.trim();
    if (trimmedText === '') {
      return 0;
    }
    // Split by whitespace and filter out empty strings
    return trimmedText.split(/\s+/).filter((word) => word.length > 0).length;
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
   * Gets the next available session ID for the selected event.
   * Generates session IDs in the format: EventName_001, EventName_002, etc.
   * @returns {string} The next available session ID
   * @throws {Error} If event name is not set or if unable to generate unique ID
   */
  public getNextSessionId = (): string => {
    if (!this.selectedEvent || this.selectedEvent.trim() === '') {
      console.error('Event name is not set. Cannot generate session ID.');
      throw new Error('Event name is required to generate session ID');
    }

    let newSessionId;
    if (!this.sessions.length) {
      newSessionId = `${this.selectedEvent}_001`;
    } else {
      const validSessionIds: string[] = this.sessions
        .map((session) => {
          if (!session.SessionId || typeof session.SessionId !== 'string') {
            console.warn('Invalid SessionId found:', session.SessionId);
            return null;
          }

          const parts = session.SessionId.split('_');
          if (parts.length !== 2) {
            console.warn(
              'SessionId format invalid (expected: EventName_Number):',
              session.SessionId
            );
            return null;
          }

          const numberPart = parts[1];
          const parsedNumber = parseInt(numberPart, 10);

          if (isNaN(parsedNumber)) {
            console.warn(
              'SessionId number part is not a valid number:',
              numberPart,
              'from:',
              session.SessionId
            );
            return null;
          }

          return session.SessionId;
        })
        .filter((id): id is string => id !== null);

      if (validSessionIds.length === 0) {
        console.warn('No valid session IDs found, starting with first session');
        newSessionId = `${this.selectedEvent}_001`;
      } else {
        const sessionNumbers = validSessionIds
          .map((id) => parseInt(id.split('_')[1], 10))
          .filter((num) => !isNaN(num));

        const startCounter =
          sessionNumbers.length > 0 ? Math.max(...sessionNumbers) + 1 : 1;

        let counter = startCounter;
        const maxAttempts = 1000;
        let attempts = 0;

        do {
          newSessionId = `${this.selectedEvent}_${counter.toString().padStart(3, '0')}`;
          counter++;
          attempts++;

          if (attempts >= maxAttempts) {
            console.error(
              `Failed to generate unique session ID after ${maxAttempts} attempts`
            );
            throw new Error(
              `Failed to generate unique session ID after ${maxAttempts} attempts`
            );
          }
        } while (validSessionIds.includes(newSessionId));
      }
    }

    if (!newSessionId) {
      console.error('Failed to generate session ID');
      throw new Error('Failed to generate session ID');
    }

    return newSessionId;
  };

  /**
   * Formats a date to UTC string format.
   * @param {Date} date - The date to format
   * @returns {string} Formatted UTC date string
   */
  getUTCFormattedTime(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+00:00`;
  }

  /**
   * Creates a new session and opens the session details modal.
   * @returns {void}
   */
  public createNewSession = (): void => {
    if (!this.selectedEvent || this.selectedEvent.trim() === '') {
      this.snackBar.open(
        'Please select an event before creating sessions',
        'Close',
        { duration: 3000, panelClass: ['snackbar-error'] }
      );
      return;
    }

    try {
      const newSessionId = this.getNextSessionId();
      const startTime = new Date();
      const duration = 20;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      const sessionData: Session = {
        GenerateInsights: true,
        Event: this.selectedEvent,
        Track: '',
        Editor: '',
        SessionTitle: '',
        SessionId: newSessionId,
        SpeakersInfo: [],
        SessionDescription: '',
        Status: 'NOT_STARTED',
        EndsAt: this.getUTCFormattedTime(endTime),
        Type: 'presentation',
        PrimarySessionId: newSessionId,
        EventDay: this.uniqueDays.length > 0 ? this.uniqueDays[0] : 'Day 1',
        Duration: `${duration}`,
        Location: '',
        SessionSubject: '',
        StartsAt: this.getUTCFormattedTime(startTime),
        ShouldHideOnSecondScreen: false,
      };
      this.openSessionDetailsModal(sessionData, 'NEW');
    } catch (error: any) {
      console.error('Error creating new session:', error);
      this.displayErrorMessage(
        error?.message || 'Failed to create new session. Please try again.'
      );
    }
  };

  /**
   * Adjusts session times by timezone difference.
   * For now, returns sessions as-is since timezone handling may not be needed.
   * @param {Session[]} sessions - Sessions to adjust
   * @returns {Session[]} Adjusted sessions
   */
  adjustSessionTimes(sessions: Session[]): Session[] {
    // If timezone adjustment is needed, implement it here
    // For now, just ensure times have proper format
    return sessions.map((session) => {
      const updatedSession = { ...session };
      if (
        typeof updatedSession.StartsAt === 'string' &&
        !updatedSession.StartsAt.endsWith('+0000') &&
        !updatedSession.StartsAt.includes('+')
      ) {
        updatedSession.StartsAt += '+0000';
      }
      if (
        typeof updatedSession.EndsAt === 'string' &&
        !updatedSession.EndsAt.endsWith('+0000') &&
        !updatedSession.EndsAt.includes('+')
      ) {
        updatedSession.EndsAt += '+0000';
      }
      return updatedSession;
    });
  }

  /**
   * Opens the session details modal for creating or editing a session.
   * @param {Session} data - The session data to edit, or new session data
   * @param {string} type - 'NEW' for new session, 'EDIT' for editing
   * @returns {void}
   */
  openSessionDetailsModal(data: Session, type: string): void {
    // Convert datetime format to datetime-local format for input fields
    const sessionData = { ...data };

    // Ensure StartsAt and EndsAt are in the correct format for datetime-local input
    // datetime-local expects: YYYY-MM-DDTHH:mm
    if (sessionData.StartsAt) {
      try {
        // Handle various date formats
        let startDate: Date;
        if (sessionData.StartsAt.includes('T')) {
          startDate = new Date(sessionData.StartsAt);
        } else if (sessionData.StartsAt.includes('+')) {
          startDate = new Date(sessionData.StartsAt.replace(' ', 'T'));
        } else {
          startDate = new Date(sessionData.StartsAt.replace(' ', 'T'));
        }
        if (!isNaN(startDate.getTime())) {
          sessionData.StartsAt = this.formatDateTimeLocal(startDate);
        }
      } catch (error) {
        console.error('Error parsing StartsAt:', error);
      }
    }

    if (sessionData.EndsAt) {
      try {
        let endDate: Date;
        if (sessionData.EndsAt.includes('T')) {
          endDate = new Date(sessionData.EndsAt);
        } else if (sessionData.EndsAt.includes('+')) {
          endDate = new Date(sessionData.EndsAt.replace(' ', 'T'));
        } else {
          endDate = new Date(sessionData.EndsAt.replace(' ', 'T'));
        }
        if (!isNaN(endDate.getTime())) {
          sessionData.EndsAt = this.formatDateTimeLocal(endDate);
        }
      } catch (error) {
        console.error('Error parsing EndsAt:', error);
      }
    }

    const dialogRef = this.dialog.open(UpdateSessionDialogComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        data: sessionData,
        type: type,
        adjustSessionTimesFn: (sessions: Session[]) =>
          this.adjustSessionTimes(sessions),
        displayErrorMessageFn: (msg: string) => this.displayErrorMessage(msg),
        trackList: [
          ...new Set(
            this.sessions
              .map((session) => session.Track)
              .filter((track) => track)
          ),
        ],
      },
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'SUCCESS') {
        this.getSessionsForEvent(this.selectedEvent);
      }
    });
  }

  /**
   * Formats a Date object to datetime-local input format (YYYY-MM-DDTHH:mm).
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Copies the session ID to the clipboard and shows a success message.
   * @param {string} sessionId - The session ID to copy
   * @returns {void}
   */
  copySessionId(sessionId: string): void {
    if (!sessionId) {
      return;
    }

    navigator.clipboard
      .writeText(sessionId)
      .then(() => {
        this.snackBar.open('Session ID copied to clipboard', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      })
      .catch((err) => {
        console.error('Failed to copy session ID:', err);
        this.snackBar.open('Failed to copy Session ID', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      });
  }

  /**
   * Copies the session title to the clipboard and shows a success message.
   * @param {string} sessionTitle - The session title to copy
   * @returns {void}
   */
  copySessionTitle(sessionTitle: string): void {
    if (!sessionTitle) {
      return;
    }

    navigator.clipboard
      .writeText(sessionTitle)
      .then(() => {
        this.snackBar.open('Session Title copied to clipboard', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      })
      .catch((err) => {
        console.error('Failed to copy session title:', err);
        this.snackBar.open('Failed to copy Session Title', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      });
  }

  /**
   * Copies the track to the clipboard and shows a success message.
   * @param {string} track - The track to copy
   * @returns {void}
   */
  copyTrack(track: string): void {
    if (!track) {
      return;
    }

    navigator.clipboard
      .writeText(track)
      .then(() => {
        this.snackBar.open('Track copied to clipboard', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      })
      .catch((err) => {
        console.error('Failed to copy track:', err);
        this.snackBar.open('Failed to copy Track', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      });
  }
}

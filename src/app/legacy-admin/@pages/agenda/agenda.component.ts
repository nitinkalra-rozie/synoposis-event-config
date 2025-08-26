import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { isUndefined } from 'lodash-es';
import { Observable, Subject } from 'rxjs';
import { debounceTime, map, switchMap, take, tap } from 'rxjs/operators';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { EventStatus } from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { TopBarComponent } from 'src/app/legacy-admin/@components/top-bar/top-bar.component';
import {
  findTimeZoneByOffset,
  TIMEZONE_OPTIONS,
} from 'src/app/legacy-admin/@data-providers/timezone.data-provider';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation.dialog.component';
import { UpdateSessionDialogComponent } from './update-session-dialog/update-session-dialog.component';
import { UploadAgendaDialogComponent } from './upload-agenda/upload-agenda-dialog.component';

interface Application {
  value: string;
  name: string;
}

interface SelectedConfig {
  type: string;
  application_id: string;
  config: any;
}

export interface SpeakerDetails {
  Title: string;
  Organization: string;
  Url: string;
  S3FileKey: string;
  SpeakerBio: string;
  isModerator: boolean;
  Name: string;
}

export interface Session {
  GenerateInsights: boolean;
  EventDay: string;
  SessionTitle: string;
  SessionDescription: string;
  SessionSubject: string;
  SessionId: string;
  PrimarySessionId: string;
  Track: string;
  Status: string;
  Location: string;
  StartsAt: string;
  EndsAt: string;
  Editor: string;
  Duration: string;
  Type: string;
  Event: string;
  SpeakersInfo: Array<SpeakerDetails>;
  ShouldHideOnSecondScreen?: boolean;
}

interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
}

export function formatDateTime(
  date: Date,
  useUTC: boolean,
  showTimezone: boolean,
  timezoneSeparator: string = ''
): string {
  // Use appropriate getters based on flag.
  const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
  const month = (useUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1)
    .toString()
    .padStart(2, '0');
  const day = (useUTC ? date.getUTCDate() : date.getDate())
    .toString()
    .padStart(2, '0');
  const hours = (useUTC ? date.getUTCHours() : date.getHours())
    .toString()
    .padStart(2, '0');
  const minutes = (useUTC ? date.getUTCMinutes() : date.getMinutes())
    .toString()
    .padStart(2, '0');
  const seconds = (useUTC ? date.getUTCSeconds() : date.getSeconds())
    .toString()
    .padStart(2, '0');

  let formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  if (showTimezone) {
    if (useUTC) {
      formatted += timezoneSeparator === ':' ? '+00:00' : '+0000';
    } else {
      // Compute local timezone offset.
      const offsetMinutes = -date.getTimezoneOffset();
      const offsetSign = offsetMinutes >= 0 ? '+' : '-';
      const absOffset = Math.abs(offsetMinutes);
      const offsetHours = Math.floor(absOffset / 60)
        .toString()
        .padStart(2, '0');
      const offsetMins = (absOffset % 60).toString().padStart(2, '0');
      formatted += `${offsetSign}${offsetHours}${timezoneSeparator}${offsetMins}`;
    }
  }

  return formatted;
}

@Component({
  selector: 'app-elsa-event-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSortModule,
    MatMenuModule,
    MatTableModule,
    MatToolbarModule,
    TopBarComponent,
  ],
  providers: [],
})
export class AgendaComponent implements OnInit, AfterViewInit {
  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIconSet(
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/mdi.svg')
    );

    this._keyTakeawayUpdate
      .pipe(debounceTime(300))
      .subscribe(({ text, index }) => {
        this.keytakeaways[index] = text;
      });

    this._insightUpdate.pipe(debounceTime(300)).subscribe(({ text, index }) => {
      this.insights[index] = text;
    });

    this._topicUpdate.pipe(debounceTime(300)).subscribe(({ text, index }) => {
      this.topics[index] = text;
    });

    this._speakerUpdate.pipe(debounceTime(300)).subscribe(({ text, index }) => {
      this.speakers[index] = text;
    });
  }

  protected readonly EventStatus = EventStatus;
  protected readonly sort = viewChild.required<MatSort>(MatSort);

  public breadCrumbItems!: Array<{}>;
  public applicationList!: Application[];
  public selectedConfig!: SelectedConfig;
  public yourHtmlContent!: SafeHtml;
  public summary!: string;
  public title!: string;
  public folder_name!: string;
  public crawl_depth!: string;
  public crawl_type!: string;
  public exclude_url_list!: string;
  public crawl_url_list!: string;
  public selected_session: string = '';
  public selected_session_details!: Session;
  public original_debrief!: {};
  public transcript: Array<string> = [];
  public realtimeinsights: Array<RealtimeInsight> = [];
  public selected_track: string = '';
  public selected_day: string = '';
  public isLoading: boolean = true;
  public dataLoaded: boolean = false;
  public postInsightTimestamp: string = '';
  public trendsTimestamp: string = '';
  public eventName: string = '';
  public trends: Array<{ title: string; description: string }> = [];
  public insights: Array<string> = [];
  public keytakeaways: Array<string> = [];
  public isEventsLoaded: boolean = false;
  public isEditorMode: boolean = false;
  public topics: Array<string> = [];
  public speakers: Array<string> = [];
  public session_details: Session[] = [];
  public availableTimezones: { value: string; label: string }[] =
    inject(TIMEZONE_OPTIONS);
  public selectedTimezone: string = '+0:00';
  public eventTimezone: string = '+0:00';
  public selectedStatus: { label: string; class: string } = {
    label: 'In Review',
    class: 'status-in-progress',
  };

  public statuses = [
    { label: 'Not started', class: 'status-not-started' },
    { label: 'In review', class: 'status-in-progress' },
    { label: 'Complete', class: 'status-complete' },
  ];

  public displayedColumns: string[] = [
    'startDate',
    'startTime',
    'endTime',
    'title',
    'sessionid',
    'Type',
    'status',
    'track',
    'actions',
  ];

  public filtered_sessions: Session[] = [];
  public uniqueDays: string[] = [];
  public availableTracks: string[] = [];

  public dataSource = new MatTableDataSource<Session>([]);
  public selectedRowIndex: number | null = null;

  private _keyTakeawayUpdate: Subject<{ text: string; index: number }> =
    new Subject();
  private _realtimeInsightUpdate: Subject<{ text: string; index: number }> =
    new Subject();
  private _insightUpdate: Subject<{ text: string; index: number }> =
    new Subject();
  private _topicUpdate: Subject<{ text: string; index: number }> =
    new Subject();
  private _speakerUpdate: Subject<{ text: string; index: number }> =
    new Subject();

  private _backendApiService = inject(BackendApiService);
  private _legacyBackendApiService = inject(LegacyBackendApiService);
  private _authFacade = inject(AuthFacade);

  // -- Lifecycle and Methods with explicit return types:
  ngOnInit(): void {
    // BreadCrumb Set
    this.breadCrumbItems = [
      { label: 'Elsa Events' },
      { label: 'Edit Report', active: true },
    ];
    this.isLoading = true;
    this.getEventDetails();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
  }

  convertDate(dateString: string): string {
    // Replace the space with 'T' to parse the date correctly
    const parsedDate = new Date(dateString.replace(' ', 'T'));
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Intl.DateTimeFormat('en-US', options).format(parsedDate);
  }

  updateTimezone(): void {
    this.openConfirmationDialog();
  }

  formatTimezone(utcOffset: string): string {
    return findTimeZoneByOffset(utcOffset, new Date(), this.availableTimezones);
  }

  showError(): void {
    this.snackBar.open(
      'This session debriefs are not available yet!',
      'Close',
      { duration: 5000, panelClass: ['error-snackbar'] }
    );
  }

  trackByFn(index: number, item: string): number {
    return index; // or a unique identifier if you have one
  }

  getUniqueDays(): void {
    const days = this.session_details.map((session) => session.EventDay);
    this.uniqueDays = Array.from(new Set(days)).reverse(); // Get unique days
  }

  filterTracksByDay(): void {
    if (this.selected_day) {
      const tracks = this.session_details
        .filter((session) => session.EventDay === this.selected_day)
        .map((session) => session.Track);
      this.availableTracks = Array.from(new Set(tracks)); // Get unique tracks
      this.filtered_sessions = []; // Reset sessions when the day changes
      this.selected_track =
        this.availableTracks.length > 0 ? this.availableTracks[0] : '';
      this.filterSessionsByTrack();
    } else {
      this.availableTracks = [];
    }
  }

  filterSessionsByTrack(): void {
    if (this.selected_day && this.selected_track) {
      this.filtered_sessions = this.session_details.filter(
        (session) =>
          session.EventDay === this.selected_day &&
          session.Track === this.selected_track
      );
      const sessionID = this.filtered_sessions[0];
      this.selected_session =
        sessionID && sessionID['Status'] !== 'NOT_STARTED'
          ? sessionID['SessionId']
          : '';
      this.dataLoaded = false;
      if (this.selected_session) {
        this.selectSession(sessionID);
      }
    } else {
      this.filtered_sessions = [];
    }
  }

  enableEditMode(): void {
    this.changeEventStatus(this.selected_session_details.Status);
  }

  changeEventStatus(status): void {
    this.isLoading = true;

    this._authFacade
      .getUserEmail$()
      .pipe(
        take(1),
        map((email) => ({
          action: 'changeEventStatus',
          sessionId: this.selected_session,
          status: status,
          changeEditMode: true,
          editor: email,
        })),
        switchMap((debrief) =>
          this._backendApiService.changeEventStatus(debrief)
        ),
        tap({
          next: (response) => {
            console.log(response['data']);
            if (response['data'].status == 'SUCCESS') {
              this.isEditorMode = true;
            } else {
              this.snackBar.open(
                'Another editor already editing this session!',
                'Close',
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
            }
            this.getEventDetails();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error fetching data:', error);
            this.isLoading = false;
          },
        })
      )
      .subscribe();
  }

  public checkSessionLocked = (
    data: any[],
    session_id: string
  ): Observable<boolean> =>
    this._authFacade.getUserEmail$().pipe(
      take(1),
      map((email) =>
        isUndefined(
          data.find(
            (session) =>
              session.SessionId === session_id && session.Editing === email
          )
        )
      )
    );

  public getEventDetails = (): void => {
    this.isLoading = true;
    this._legacyBackendApiService
      .getEventDetails()
      .subscribe((response: any) => {
        this.session_details = response.data;
        this.eventName = this._legacyBackendApiService.getCurrentEventName();
        this.selectedTimezone =
          this._legacyBackendApiService.getCurrentTimezone();
        this.eventTimezone = this._legacyBackendApiService.getCurrentTimezone();
        if (response.data.length > 0) {
          this.dataSource.data = response.data;
          this.dataSource._updateChangeSubscription();
          if (this.selected_day === '') {
            this.getUniqueDays();
            if (
              this.selected_day === '' ||
              !this.uniqueDays.includes(this.selected_day)
            ) {
              this.selected_day =
                this.uniqueDays.length > 0 ? this.uniqueDays[0] : '';
              this.filterTracksByDay();
            }
          }
        }
        this.isLoading = false;
      });
  };

  // TODO:@later move this to a service
  public getNextSessionId = (): string => {
    if (!this.eventName || this.eventName.trim() === '') {
      console.error('Event name is not set. Cannot generate session ID.');
      throw new Error('Event name is required to generate session ID');
    }

    let newSessionId;
    if (!this.session_details.length) {
      newSessionId = `${this.eventName}_001`;
    } else {
      const validSessionIds: string[] = this.session_details
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
        newSessionId = `${this.eventName}_001`;
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
          newSessionId = `${this.eventName}_${counter.toString().padStart(3, '0')}`;
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

  getUTCFormattedTime(date: Date): string {
    return formatDateTime(date, true, true, ':');
  }

  getCurrentFormattedLocalTime(): string {
    const now = new Date();
    return formatDateTime(now, false, true, '');
  }

  public createNewSession = (): void => {
    if (!this.eventName || this.eventName.trim() === '') {
      this.snackBar.open(
        'Please wait for event details to load before creating sessions',
        'Close',
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }

    const newSessionId = this.getNextSessionId();
    const startTime = new Date();
    const duration = 20;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const sessionData: Session = {
      GenerateInsights: true,
      Event: this.eventName,
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
      EventDay: 'Day 1',
      Duration: `${duration}`,
      Location: '',
      SessionSubject: '',
      StartsAt: this.getUTCFormattedTime(startTime),
      ShouldHideOnSecondScreen: false,
    };
    this.openSessionDetailsModal(sessionData, 'NEW');
  };

  highlightRow(row: Session, index: number): void {
    this.selectedRowIndex = index;
    this.selectSession(row);
    this.openSessionDetailsModal(row, 'EDIT');
  }

  selectSession(session: any): void {
    this.selected_session = session['SessionId'];
    // Use const instead of let since we're not reassigning sessionObj
    const sessionObj = JSON.parse(JSON.stringify(session));
    if (sessionObj.StartsAt) {
      sessionObj.StartsAt = this.convertDate(sessionObj.StartsAt);
    }
    this.selected_session_details = sessionObj;
  }

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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  trackByIndex(index: number, _item: any): number {
    return index;
  }

  removeKeytakeaway(index: number): void {
    this.keytakeaways.splice(index, 1);
  }

  addNewKeytakeaway(): void {
    this.keytakeaways.push('');
  }

  removeInsight(index: number): void {
    this.insights.splice(index, 1);
  }

  removeTopic(index: number): void {
    this.topics.splice(index, 1);
  }

  addNewInsight(): void {
    this.insights.push('');
  }

  addNewTopic(): void {
    this.topics.push('');
  }

  onKeyTakeawayChange(value: string, index: number): void {
    this._keyTakeawayUpdate.next({ text: value, index });
  }

  onInsightChange(value: string, index: number): void {
    this._insightUpdate.next({ text: value, index });
  }

  onRealtimeInsightChange(value: string, index: number): void {
    this._realtimeInsightUpdate.next({ text: value, index });
  }

  onTopicChange(value: string, index: number): void {
    this._topicUpdate.next({ text: value, index });
  }

  onSpeakerChange(value: string, index: number): void {
    this._speakerUpdate.next({ text: value, index });
  }

  hideSession(row: Session): void {
    row.Status = 'NOT_AVAILABLE';
    this.isLoading = true;
    this._backendApiService.updateAgenda([row]).subscribe({
      next: (response) => {
        this.getEventDetails();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.displayErrorMessage('Server error updating event status.');
        this.isLoading = false;
      },
    });
  }

  refreshAgenda(): void {
    this.getEventDetails();
  }

  openConfirmationDialog(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        eventTimezone: this.eventTimezone,
        updateEventTimezone: (selectedTimezone) =>
          this.updateEventTimezone(selectedTimezone, this.eventTimezone),
        getTimezoneDifferenceFn: (selectedTimezone) =>
          this.getTimezoneDifference(this.eventTimezone, selectedTimezone),
        availableTimezones: this.availableTimezones,
        title: 'Confirm Timezone Update',
        message:
          'Are you sure you want to update the event timezone? This will change the start and end times of all sessions relative to UTC.',
        warning: `Warning: Session UTC times will be adjusted by 0 hour from their previous values.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        this.selectedTimezone = this.eventTimezone;
      }
    });
  }

  displayErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 20000,
      panelClass: ['snackbar-error'],
    });
  }

  updateEventTimezone(selectedTimezone, eventTimezone): void {
    const timeDiff = this.getTimezoneDifference(
      eventTimezone,
      selectedTimezone
    );
    this.isLoading = true;
    this._backendApiService.getEventDetails().subscribe({
      next: (response: any) => {
        const latestSessionData: Session[] = response.data;
        const updatedSessionData = this.adjustSessionTimes(
          latestSessionData,
          timeDiff
        );
        this._backendApiService
          .updateAgenda(updatedSessionData, selectedTimezone)
          .subscribe({
            next: (response) => {
              this.getEventDetails();
            },
            error: (error) => {
              console.error('Error fetching data:', error);
              this.displayErrorMessage('Server error updating timezone');
              this.isLoading = false;
              this.selectedTimezone = this.eventTimezone;
            },
          });
      },
      error: (error) => {
        this.displayErrorMessage('Error updating timezone');
        this.isLoading = false;
        this.selectedTimezone = this.eventTimezone;
      },
    });
  }

  public get formattedTimezone(): string {
    const match = this.eventTimezone.match(/^([+-])(\d+)(?::(\d+))?/);
    if (!match) return '+0000'; // Fallback to UTC
    const sign = match[1];
    const hours = match[2].padStart(2, '0');
    const minutes = (match[3] || '00').padStart(2, '0');
    return `${sign}${hours}${minutes}`;
  }

  public get formattedToLocalTime(): string {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = Math.floor(absOffset / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (absOffset % 60).toString().padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
  }

  adjustSessionTimes(sessions: Session[], hoursToAdjust: number): Session[] {
    return sessions.map((session): Session => {
      const adjustTime = (datetime: string): string => {
        const isoString = datetime
          .replace(' ', 'T')
          .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
        const date = new Date(isoString);
        const adjustedTime = date.getTime() + hoursToAdjust * 60 * 60 * 1000;
        const adjustedDate = new Date(adjustedTime);
        return (
          [
            adjustedDate.getUTCFullYear(),
            String(adjustedDate.getUTCMonth() + 1).padStart(2, '0'),
            String(adjustedDate.getUTCDate()).padStart(2, '0'),
          ].join('-') +
          ' ' +
          [
            String(adjustedDate.getUTCHours()).padStart(2, '0'),
            String(adjustedDate.getUTCMinutes()).padStart(2, '0'),
            String(adjustedDate.getUTCSeconds()).padStart(2, '0'),
          ].join(':') +
          '+0000'
        );
      };

      return {
        ...session,
        StartsAt: adjustTime(session.StartsAt),
        EndsAt: adjustTime(session.EndsAt),
      };
    });
  }

  openSessionDetailsModal(data: Session, type: string): void {
    const timeDiff = this.getTimezoneDifference('+0:00', this.eventTimezone);
    let adjustedSessionData = this.adjustSessionTimes(
      [data],
      this.getTimezoneDifference(this.eventTimezone, '+0:00')
    );

    adjustedSessionData = adjustedSessionData.map((s) => ({
      ...s,
      StartsAt: s.StartsAt.endsWith('+0000')
        ? s.StartsAt.slice(0, -5)
        : s.StartsAt,
      EndsAt: s.EndsAt.endsWith('+0000') ? s.EndsAt.slice(0, -5) : s.EndsAt,
    }));
    const dialogRef = this.dialog.open(UpdateSessionDialogComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        data: adjustedSessionData?.[0],
        adjustSessionTimesFn: (data) => this.adjustSessionTimes(data, timeDiff),
        displayErrorMessageFn: (msg) => this.displayErrorMessage(msg),
        type: type,
        trackList: [
          ...new Set(
            this.session_details
              .map((session) => session.Track)
              .filter((track) => track)
          ),
        ],
      },
      panelClass: 'custom-dialog-container',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'SUCCESS') {
        this.getEventDetails();
      }
    });
  }

  getTimezoneDifference(timezoneA, timezoneB): number {
    const parseOffset = (tz): number => {
      const [hours, minutes] = tz.split(':').map(Number);
      return hours + (Math.sign(hours) * minutes) / 60;
    };
    const offset1 = parseOffset(timezoneA);
    const offset2 = parseOffset(timezoneB);
    return offset1 - offset2;
  }

  openUploadAgendaDialog(): void {
    const timeDiff = this.getTimezoneDifference('+0:00', this.eventTimezone);
    const dialogRef = this.dialog.open(UploadAgendaDialogComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        nextSessionId: this.getNextSessionId(),
        adjustSessionTimesFn: (data) => this.adjustSessionTimes(data, timeDiff),
        displayErrorMessageFn: (msg) => this.displayErrorMessage(msg),
        eventName: this.eventName,
        trackList: [
          ...new Set(
            this.session_details
              .map((session) => session.Track)
              .filter((track) => track)
          ),
        ],
      },
      panelClass: 'custom-dialog-container',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'SUCCESS') {
        this.getEventDetails();
      }
    });
  }
}

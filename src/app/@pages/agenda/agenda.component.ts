import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionDialogComponent } from './dialog/original-debrief-modal-dialog.component';
import { UploadAgendaDialogComponent } from './upload-agenda/upload-agenda-dialog.component';
import { BackendApiService } from 'src/app/@services/backend-api.service';
import { BackendApiService as LegacyBackendApiService } from 'src/app/services/backend-api.service';
import { AuthService } from 'src/app/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { isUndefined } from 'lodash-es';
import { TopBarComponent } from 'src/app/components/shared/top-bar/top-bar.component';
import { SidebarControlPanelComponent } from 'src/app/@components/sidebar-control-panel/sidebar-control-panel.component';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

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
}

interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
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
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTableModule,
    MatToolbarModule,
    TopBarComponent,
    SidebarControlPanelComponent,
    UploadAgendaDialogComponent,
    SessionDialogComponent,
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

  @ViewChild(MatPaginator) public paginator!: MatPaginator;
  @ViewChild(MatSort) public sort!: MatSort;

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
    'title',
    'sessionid',
    'Type',
    'status',
    'startDate',
    'startTime',
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
  private _authService = inject(AuthService);

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
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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

  showError(): void {
    this.snackBar.open(
      'This session debriefs are not available yet!',
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar'],
      }
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

  changeEventStatus(status: string): void {
    this.isLoading = true;
    const debrief = {
      action: 'changeEventStatus',
      sessionId: this.selected_session,
      status: status,
      changeEditMode: true,
      editor: this._authService.getUserEmail(),
    };
    this._backendApiService.changeEventStatus(debrief).subscribe({
      next: (response) => {
        console.log(response['data']);
        if (response['data'].status === 'SUCCESS') {
          this.isEditorMode = true;
        } else {
          this.snackBar.open(
            'Another editor already editing this session!',
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            }
          );
        }
        this.getEventDetails();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
    });
  }

  public checkSessionLocked = (data: any[], session_id: string): boolean => {
    const exist = data.find(
      (session) =>
        session.SessionId === session_id &&
        session.Editing === this._authService.getUserEmail()
    );
    return isUndefined(exist);
  };

  public getEventDetails = (): void => {
    this.isLoading = true;
    this._legacyBackendApiService
      .getEventDetails()
      .subscribe((response: any) => {
        this.session_details = response.data;
        this.eventName = this._legacyBackendApiService.getCurrentEventName();
        if (response.data.length > 0) {
          console.log('get events response', response.data);
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

  public getNextSessionId = (): string => {
    let newSessionId;
    if (!this.session_details.length) {
      console.log('No sessions available. Starting with first session.');
      newSessionId = `${this.eventName}_001`;
    } else {
      const sessionIds: number[] = this.session_details.map((session) =>
        parseInt(session.SessionId.split('_')[1], 10)
      );
      const maxSessionId = Math.max(...sessionIds, 0); // Default to 0 if empty
      const newSessionIdNumber = maxSessionId + 1;
      const prefix = this.eventName;
      newSessionId = `${prefix}_${newSessionIdNumber.toString().padStart(3, '0')}`;
    }
    return newSessionId;
  };

  public createNewSession = (): void => {
    const newSessionId = this.getNextSessionId();
    console.log('new session id', newSessionId);
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
      EndsAt: this.getUTCFormattedTime(new Date()),
      Type: 'presentation',
      PrimarySessionId: newSessionId,
      EventDay: 'Day 1',
      Duration: '40',
      Location: '',
      SessionSubject: '',
      StartsAt: this.getUTCFormattedTime(new Date()),
    };
    this.openSessionDetailsModal(sessionData, 'NEW');
  };

  getUTCFormattedTime(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}+00:00`;
  }

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
    console.log('Selected session:', session);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'NOT_AVAILABLE':
        return 'status-not-available';
      case 'NOT_STARTED':
        return 'status-not-started';
      case 'UNDER_REVIEW':
        return 'status-in-review';
      case 'REVIEW_COMPLETED':
        return 'status-completed';
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
        this.isLoading = false;
      },
    });
  }

  openSessionDetailsModal(data: Session, type: string): void {
    const dialogRef = this.dialog.open(SessionDialogComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        data: data,
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
        console.log('Dialog closed with:', result);
        this.getEventDetails();
      }
    });
  }

  openUploadAgendaDialog(): void {
    const dialogRef = this.dialog.open(UploadAgendaDialogComponent, {
      width: '1200px',
      maxWidth: 'none',
      data: {
        nextSessionId: this.getNextSessionId(),
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
        console.log('Dialog closed with:', result);
        this.getEventDetails();
      }
    });
  }
}

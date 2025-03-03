import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LargeModalDialogComponent } from './dialog/original-debrief-modal-dialog.component';
import { BackendApiService } from 'src/app/@services/backend-api.service';
import { BackendApiService as LegacyBackendApiService } from 'src/app/services/backend-api.service';
import { AuthService } from 'src/app/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { isUndefined } from 'lodash-es';
import { TopBarComponent } from 'src/app/components/shared/top-bar/top-bar.component';
import { SidebarControlPanelComponent } from 'src/app/@components/sidebar-control-panel/sidebar-control-panel.component';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {
  MarkdownEditorDialogComponent,
  MarkdownEditorData,
} from './edit-content-dialog/markdown-editor-dialog.component';

interface Application {
  value: string;
  name: string;
}

interface SelectedConfig {
  type: string;
  application_id: string;
  config: any;
}

type BreakoutSessionEntry = {
  title: string;
  sessionId: string;
};
type BreakoutSessionMap = Record<string, BreakoutSessionEntry>;

interface Session {
  EventDay: string;
  SessionTitle: string;
  SessionId: string;
  PrimarySessionId: string;
  Track: string;
  Status: string;
  Location: string;
  StartsAt: string;
  Editor: string;
  Duration: string;
  Type: string;
  Event: string;
  SpeakersInfo: any;
}

export interface VersionData {
  version: string;
  promptVersion: string;
  pdfPath: string;
}

interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
}

const promptSchema = {
  keynote: ['session_debrief'],
  panel_discussion: ['session_debrief'],
  talk: ['session_debrief'],
  fireside_chat: ['session_debrief'],
  closing: ['session_debrief'],
  presentation: ['session_debrief'],
  welcome: ['session_debrief'],
  breakout: ['session_debrief'],
};

@Component({
  selector: 'app-loading-dialog',
  standalone: true,
  template: `
    <div style="text-align: center; padding: 2rem;">
      <h2>Opening PDF...</h2>
      <div style="display:flex;justify-content: center;">
        <mat-spinner [diameter]="32" [strokeWidth]="3"></mat-spinner>
        <div></div>
      </div>
    </div>
  `,
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule],
})
export class LoadingDialogComponent {}

@Component({
  selector: 'app-elsa-event-generate-report',
  templateUrl: './content-generate.component.html',
  styleUrls: ['./content-generate.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
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
    MatToolbarModule,
    MatMenuModule,
    TopBarComponent,
    SidebarControlPanelComponent,
    LargeModalDialogComponent,
    LoadingDialogComponent,
  ],
  providers: [],
})
export class ContentGenerateComponent implements OnInit, AfterViewInit {
  constructor(
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    // Register Material icons
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
  public isLoading: boolean = false;
  public isContentLoading: boolean = false;
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

  public sessionTypes: string[] = Object.keys(promptSchema);
  public selectedSessionType: string = '';

  public reportTypes: string[] = [];
  public selectedReportType: string = '';
  public manualTranscript: string = '';

  public transcriptSources: string[] = [
    'Database',
    'Upload Video',
    'Upload Audio',
    'Text Input',
  ];
  public selectedTranscriptSource: string = '';
  public lastGeneratedVersion: string = '';
  public availablePromptVersions: string[] = ['1'];
  public selectedPromptVersion: string = '';

  public filtered_sessions: Session[] = [];
  public uniqueDays: string[] = [];
  public availableTracks: string[] = [];

  public displayedColumns: string[] = [
    'select',
    'version',
    'promptVersion',
    'pdfPath',
    'actions',
  ];

  public dataSource = new MatTableDataSource<VersionData>([]);
  public selectedRowIndex: number | null = null;

  public versions: VersionData[] = [];
  public statusSignal = signal<'idle' | 'generating' | 'creating' | 'done'>(
    'idle'
  );
  public status = this.statusSignal;
  private _keyTakeawayUpdate = new Subject<{ text: string; index: number }>();
  private _realtimeInsightUpdate = new Subject<{
    text: string;
    index: number;
  }>();
  private _insightUpdate = new Subject<{ text: string; index: number }>();
  private _topicUpdate = new Subject<{ text: string; index: number }>();
  private _speakerUpdate = new Subject<{ text: string; index: number }>();
  private _backendApiService = inject(BackendApiService);
  private _legacyBackendApiService = inject(LegacyBackendApiService);

  private _authService = inject(AuthService);

  ngOnInit(): void {
    // BreadCrumb Set
    this.breadCrumbItems = [
      { label: 'Elsa Events' },
      { label: 'Edit Report', active: true },
    ];
    this._legacyBackendApiService.getEventDetails().subscribe((data: any) => {
      this.getEventDetails();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyInitialPromptFilter(): void {
    this.selectedSessionType = this.sessionTypes[0];
    this.reportTypes = promptSchema[this.selectedSessionType];
    this.selectedReportType = this.reportTypes[0];
    this.selectedTranscriptSource = this.transcriptSources[0];
    this.selectedPromptVersion = this.availablePromptVersions[0];
  }

  onSessionTypeChange(newSessionType: string): void {
    this.reportTypes = promptSchema[newSessionType] || [];
    this.selectedReportType = this.reportTypes[0];
    this.getContentVersions();
  }

  onReportTypeChange(newReportType: string): void {
    this.selectedReportType = newReportType;
    this.getContentVersions();
  }

  getContentVersions(): void {
    this.dataSource.data = [];
    this.isContentLoading = true;
    const data = {
      eventId: this.eventName,
      sessionId: this.selected_session,
      sessionType: this.selectedSessionType,
      reportType: this.selectedReportType,
      promptVersion: '',
    };
    this._backendApiService.getContentVersions(data).subscribe({
      next: (response) => {
        this.versions = response['versions'].map((item) => ({
          version: item.version,
          promptVersion: item.promptVersion,
          pdfPathV1: item.pdfPathV1,
          pdfPathV2: item.pdfPathV2,
        }));
        this.dataSource.data = this.versions;
        this.isContentLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isContentLoading = false;
      },
    });
  }

  highlightRow(row: VersionData, index: number): void {
    if (this.selectedRowIndex === index) {
      this.selectedRowIndex = null;
    } else {
      this.selectedRowIndex = index;
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  viewPdf(row: VersionData, promptVersion: String): void {
    this.getSignedPdfUrl(row.version, promptVersion);
  }

  viewLastGeneratedPdf(promptVersion): void {
    this.getSignedPdfUrl(this.lastGeneratedVersion, promptVersion);
  }

  editContent(row: VersionData): void {
    //alert(`Navigating to edit content for version: ${row.version}`);
    const data = {
      eventId: this.eventName,
      sessionId: this.selected_session,
      sessionType: this.selectedSessionType,
      reportType: this.selectedReportType,
      version: row.version,
    };
    this._backendApiService.getVersionContent(data).subscribe({
      next: (response) => {
        this.openMarkdownDialog(response, row.version);
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });

    // Implement your editing logic here
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

  updateEventReport(): void {
    this.isLoading = true;
    this.dataLoaded = false;
    const data = {
      action: 'get_summary_of_Single_Keynote',
      sessionId: [this.selected_session],
    };
    this._backendApiService.getEventReport(data).subscribe({
      next: (response) => {
        console.log(response);
        this.isEditorMode = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
    });
  }

  getEventReport(): void {
    this.isLoading = true;
    this.dataLoaded = false;
    this.applyInitialPromptFilter();
    const data = {
      action: 'get_summary_of_Single_Keynote',
      sessionId: [this.selected_session],
    };
    this._backendApiService.getEventReport(data).subscribe({
      next: (response) => {
        console.log(response);
        if (response?.data?.data?.[0]?.snapshotData) {
          const responseData = response?.data?.data?.[0];
          this.original_debrief = JSON.parse(JSON.stringify(responseData));
          const data = JSON.parse(responseData?.snapshotData);
          console.log(data);
          this.manualTranscript = '';
          this.summary = data['data']['summary'];
          this.insights = data['data']['insights'];
          this.topics = data['data']['topics'];
          this.keytakeaways = data['data']['key_takeaways'];
          this.speakers = data['data']['speakers'];
          this.dataLoaded = true;
          this.title = data['data']['title'];
          if (this.selected_session_details.Type == 'PrimarySession') {
            this.sessionTypes = ['breakout'];
            this.selectedSessionType = 'breakout';
            console.log(
              'breakout sessions: ',
              this.getBreakoutSessions(this.selected_session_details.SessionId)
            );
          } else {
            this.sessionTypes = [
              this.selected_session_details.Type.toLowerCase(),
            ];
            this.selectedSessionType =
              this.selected_session_details.Type.toLowerCase();
          }
          this.postInsightTimestamp = responseData['postInsightTimestamp'];
          this.trendsTimestamp = responseData['trendsTimestamp'];
          this.transcript = responseData['transcript'];
          if (responseData['trendData']) {
            const trendData = JSON.parse(responseData['trendData']);
            this.trends = trendData?.data?.trends;
          } else {
            this.trends = [];
          }
          this.getContentVersions();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
    });
  }

  generateNewVersion(): void {
    let transcript = '';
    this.statusSignal.set('generating');
    let childSectionSessionIds = {};
    if (this.selectedTranscriptSource == 'Text Input') {
      transcript = this.manualTranscript;
    }

    if (this.selectedSessionType == 'breakout') {
      childSectionSessionIds = this.getBreakoutSessions(this.selected_session);
    }
    console.log(this.selected_session_details);
    let speakers = '';
    if (this.selected_session_details.SpeakersInfo) {
      speakers = this.selected_session_details.SpeakersInfo.map((ele) =>
        ele.isModerator ? `Moderator - ${ele.Name}` : `Speaker - ${ele.Name}`
      ).join('\n');
    }
    const data = {
      sessionTranscript: '',
      eventId: this.eventName,
      sessionTitle: this.selected_session_details.SessionTitle,
      sessionId: this.selected_session,
      sessionType: this.selectedSessionType,
      reportType: this.selectedReportType,
      transcriptSource: this.selectedTranscriptSource,
      promptVersion: this.selectedPromptVersion,
      childSectionSessionIds: childSectionSessionIds,
      speakers: speakers,
      generatePDF: false,
    };
    this._backendApiService.generateContent(data).subscribe({
      next: (response) => {
        console.log(response['version']);
        this.statusSignal.set('idle');
        if (response['version']) {
          this.generateContentPDF(response['version']);
        }
        this.getContentVersions();
      },
      error: (error) => {
        this.statusSignal.set('idle');
        console.error('Error fetching data:', error);
      },
    });
  }

  generateContentPDF(version): void {
    this.statusSignal.set('creating');
    const transcript = this.transcript.join('\n');
    const data = {
      eventId: this.eventName,
      sessionId: this.selected_session,
      sessionType: this.selectedSessionType,
      reportType: this.selectedReportType,
      version: version,
    };
    this._backendApiService.generateContentPDFUrl(data).subscribe({
      next: (response) => {
        this.lastGeneratedVersion = version;
        this.getContentVersions();
        this.statusSignal.set('done');
        setTimeout(() => {
          this.statusSignal.set('idle');
        }, 4000);
      },
      error: (error) => {
        this.statusSignal.set('idle');
        console.error('Error fetching data:', error);
      },
    });
  }

  getBreakoutSessions(primarySessionId): BreakoutSessionMap {
    const breakout_sessions = this.session_details.filter(
      (session) =>
        session.PrimarySessionId === primarySessionId &&
        session.Type === 'BreakoutSession'
    );
    const output = {};
    output['0'] = {
      title: 'Introduction',
      sessionId: this.selected_session_details.SessionId,
    };
    breakout_sessions.forEach((session, index) => {
      output[(index + 1).toString()] = {
        title: 'BreakOutRoom',
        sessionId: session.SessionId || '',
      };
    });
    return output;
  }

  getSignedPdfUrl(version, promptVersion): void {
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true, // This ensures the dialog cannot be closed by the user prematurely
      }
    );

    const transcript = this.transcript.join('\n');
    const data = {
      eventId: this.eventName,
      sessionId: this.selected_session,
      sessionType: this.selectedSessionType,
      reportType: this.selectedReportType,
      version: version,
      promptVersion: promptVersion,
    };
    this._backendApiService.getSignedPdfUrl(data).subscribe({
      next: (response) => {
        console.log(response['presignedUrl']);
        dialogRef.close();
        window.open(response['presignedUrl'], '_blank');
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching data:', error);
      },
    });
  }

  openMarkdownDialog(content: any, version: string): void {
    const dialogRef = this.dialog.open(MarkdownEditorDialogComponent, {
      data: {
        initialText: JSON.stringify(content, null, 2),
        eventName: this.eventName,
        selected_session: this.selected_session,
        selectedSessionType: this.selectedSessionType,
        selectedReportType: this.selectedReportType,
        version: version,
      } as MarkdownEditorData,
      width: '1000px', // Adjust dialog width (optional)
      maxWidth: '100vw', // prevents exceeding viewport width
    });

    dialogRef.afterClosed().subscribe((result: any | undefined) => {
      if (result && result.edited) {
        this.getContentVersions();
      }
    });
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

  // Filter sessions based on the selected day and track
  filterSessionsByTrack(): void {
    if (this.selected_day && this.selected_track) {
      this.filtered_sessions = this.session_details.filter(
        (session) =>
          session.EventDay === this.selected_day &&
          session.Track === this.selected_track &&
          session.Type !== 'BreakoutSession'
      );
      const sessionID = this.filtered_sessions[0];
      this.selected_session =
        sessionID && sessionID['Status'] != 'NOT_STARTED'
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

  saveEdits(): void {
    this.postEditedDebrief();
  }

  changeEventStatus(status): void {
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
        if (response['data'].status == 'SUCCESS') {
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
    });
  }

  postEditedDebrief(): void {
    this.isLoading = true;
    const debrief = {
      realtimeinsights: this.realtimeinsights,
      summary: this.summary,
      keytakeaways: this.keytakeaways,
      insights: this.insights,
      status: this.selected_session_details.Status,
      topics: this.topics,
      trends: this.trends,
      postInsightTimestamp: this.postInsightTimestamp,
      trendsTimestamp: this.trendsTimestamp,
    };
    const data = {
      action: 'updatePostInsights',
      sessionId: this.selected_session,
      updatedData: debrief,
    };
    this._backendApiService.updatePostInsights(data).subscribe({
      next: (response) => {
        if (response['data']?.statusCode == 200) {
          this.isEditorMode = false;
          this.selected_session_details.Editor = '';
          this.getEventDetails();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
    });
  }

  
  publishPDF(version, promptVersion): void {
    const dialogRef: MatDialogRef<LoadingDialogComponent> = this.dialog.open(
      LoadingDialogComponent,
      {
        disableClose: true, // This ensures the dialog cannot be closed by the user prematurely
      }
    );
    const data = {
      eventId: this.eventName,
      sessionId: this.selected_session,
      sessionType: this.selectedSessionType,
      reportType: this.selectedReportType,
      version: version,
      promptVersion: promptVersion,
    };
    this._backendApiService.publishPdfReport(data).subscribe({
      next: (response) => {
        console.log(response);
        dialogRef.close();
      },
      error: (error) => {
        dialogRef.close();
        console.error('Error fetching data:', error);
      },
    });
  }

  checkSessionLocked(data, session_id): boolean {
    const exist = data.find(
      (session) =>
        session.SessionId === session_id &&
        session.Editing === this._authService.getUserEmail()
    );
    return isUndefined(exist);
  }

  getEventDetails(): void {
    this._backendApiService.getEventDetails().subscribe((response: any) => {
      this.session_details = response.data;
      if (response.data.length > 0) {
        console.log('get events response', response.data);
        if (this.selected_day == '') {
          this.getUniqueDays();
          if (
            this.selected_day == '' ||
            !(this.selected_day in this.uniqueDays)
          ) {
            this.selected_day =
              this.uniqueDays.length > 0 ? this.uniqueDays[0] : '';
            this.filterTracksByDay();
          }
        }
      }
      this.isLoading = false;
    });
  }

  selectSession(session: any): void {
    if (
      session['Status'] == 'NOT_STARTED' ||
      session['Status'] == 'IN_PROGRESS'
    ) {
      this.showError();
    } else {
      this.selected_session = session['SessionId'];
      const sessionObj = JSON.parse(JSON.stringify(session));
      if (sessionObj.StartsAt) {
        sessionObj.StartsAt = this.convertDate(sessionObj.StartsAt);
      }
      if (sessionObj.Editor == this._authService.getUserEmail()) {
        this.isEditorMode = true;
      } else {
        this.isEditorMode = false;
      }
      console.log('speaker', sessionObj);
      this.selected_session_details = sessionObj;
      console.log('Selected session:', session);
      this.getEventReport();
    }
  }

  // Method to dynamically assign a class based on the session's status
  getStatusClass(status: string): string {
    switch (status) {
      case 'NOT_STARTED':
        return 'status-not-started';
      case 'UNDER_REVIEW':
        return 'status-in-review';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  }

  trackByIndex(index: number, item: any): number {
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

  openLargeModal(): void {
    const data = {
      type: 'debrief',
      keytakeaways: this.keytakeaways,
      summary: this.summary,
      insights: this.insights,
      topics: this.topics,
    };
    this.dialog.open(LargeModalDialogComponent, {
      width: '1200px', // Makes the modal large
      data: data,
      panelClass: 'custom-dialog-container', // Custom CSS class for further styling
    });
  }

  openTranscriptModal(): void {
    const data = {
      type: 'transcript',
      transcript: this.transcript,
    };
    this.dialog.open(LargeModalDialogComponent, {
      width: '1200px', // Makes the modal large
      data: data,
      panelClass: 'custom-dialog-container', // Custom CSS class for further styling
    });
  }
}

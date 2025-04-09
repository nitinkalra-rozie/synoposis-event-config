import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { isUndefined } from 'lodash-es';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LargeModalDialogComponent } from 'src/app/content-editor/components/dialog/original-debrief-modal-dialog.component';
import { GenerateRealtimeInsightsDialogComponent } from 'src/app/insights-editor/components/generate-realtime-insights-dialog/generate-realtime-insights-dialog.component';
import { BackendApiService } from 'src/app/legacy-admin/@services/backend-api.service';
import { AuthService } from 'src/app/legacy-admin/services/auth.service';
import { BackendApiService as LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { LayoutMainComponent } from 'src/app/shared/layouts/layout-main/layout-main.component';

interface Application {
  value: string;
  name: string;
}

interface SelectedConfig {
  type: string;
  application_id: string;
  config: any;
}

interface Session {
  EventDay: string;
  SessionTitle: string;
  SessionId: string;
  Track: string;
  Status: string;
  Location: string;
  StartsAt: string;
  Editor: string;
  Duration: string;
  Type: string;
  Event: string;
  Speakers: any;
}

interface RealtimeInsight {
  Timestamp: string;
  Insights: Array<string>;
}

@Component({
  selector: 'app-insights-editor',
  templateUrl: './insights-editor.component.html',
  styleUrls: ['./insights-editor.component.scss'],
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
    MatToolbarModule,
    LayoutMainComponent,
  ],
})
export class InsightsEditorComponent implements OnInit {
  constructor(
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

  public filtered_sessions: Session[] = [];
  public uniqueDays: string[] = [];
  public availableTracks: string[] = [];

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

  // Methods
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

  sendEmail(): void {
    this._backendApiService.sendEmailReport().subscribe({
      next: (response) => {
        if (response['success'] == true) {
          console.log(response);
        }
      },
      error: (error) => {
        console.error('Error sending email:', error);
      },
    });
  }

  updateEventReport(): void {
    this.isLoading = true;
    this.dataLoaded = false;
    const data = {
      action: 'getDebriefData',
      sessionIds: [this.selected_session],
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
    const data = {
      action: 'getDebriefData',
      sessionIds: [this.selected_session],
    };
    this._backendApiService.getEventReport(data).subscribe({
      next: (response) => {
        console.log(response);
        if (response?.data?.[0]?.snapshotData) {
          const responseData = response?.data[0];
          this.original_debrief = JSON.parse(JSON.stringify(responseData));
          const data = JSON.parse(responseData.snapshotData);
          this.summary = data['data']['summary'];
          this.insights = data['data']['insights'];
          this.topics = data['data']['topics'];
          this.keytakeaways = data['data']['key_takeaways'];
          this.speakers = data['data']['speakers'];
          this.dataLoaded = true;
          this.title = data['data']['title'];
          this.postInsightTimestamp = responseData['postInsightTimestamp'];
          this.trendsTimestamp = responseData['trendsTimestamp'];
          this.transcript = responseData['transcript'];
          if (responseData['trendData']) {
            const trendData = JSON.parse(responseData['trendData']);
            this.trends = trendData?.data?.trends;
          } else {
            this.trends = [];
          }

          const realtimeinsights = responseData['realtimeinsights'];
          this.realtimeinsights = [];
          for (const item of realtimeinsights) {
            const dataItem = JSON.parse(item.Response);
            this.realtimeinsights.push({
              Timestamp: item.Timestamp,
              Insights: dataItem.data.insights,
            });
          }
          console.log(this.realtimeinsights);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
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
        if (response['data'].statusCode == 200) {
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

  openGenerateRealtimeInsightsModal(): void {
    const data = {
      type: 'generate_realtime',
      transcript: this.transcript,
      selected_session: this.selected_session_details,
    };
    this.dialog.open(GenerateRealtimeInsightsDialogComponent, {
      width: '1200px', // Makes the modal large
      data: data,
      panelClass: 'custom-dialog-container', // Custom CSS class for further styling
    });
  }
}

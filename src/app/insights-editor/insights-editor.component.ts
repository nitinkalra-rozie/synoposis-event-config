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
import { clone, cloneDeep, isUndefined } from 'lodash-es';
import { Observable, Subject, throwError } from 'rxjs';
import {
  catchError,
  debounceTime,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { LargeModalDialogComponent } from 'src/app/content-editor/components/dialog/original-debrief-modal-dialog.component';
import { AuthService } from 'src/app/core/auth/services/auth-service';
import {
  ChangeEventStatusRequest,
  EventStatus,
  RealtimeInsight,
  Session,
} from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { InsightsEditorDataService } from 'src/app/insights-editor/data-services/insights-editor.data-service';
import { LayoutMainComponent } from 'src/app/shared/layouts/layout-main/layout-main.component';
import { getAbsoluteDate } from 'src/app/shared/utils/date-util';
import { getLocalStorageItem } from 'src/app/shared/utils/local-storage-util';

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

    this._keyTakeawayUpdate$
      .pipe(debounceTime(300))
      .subscribe(({ text, index }) => {
        this._keyTakeawaysData[index] = text;
      });

    this._insightUpdate$
      .pipe(debounceTime(300))
      .subscribe(({ text, index }) => {
        this._insightsData[index] = text;
      });

    this._topicUpdate$.pipe(debounceTime(300)).subscribe(({ text, index }) => {
      this._topicsData[index] = text;
    });

    this._realtimeInsightUpdate$
      .pipe(debounceTime(300))
      .subscribe(({ text, indexI, indexJ }) => {
        this._realTimeInsightsData[indexI].Insights[indexJ] = text;
      });
  }
  public readonly EventStatus = EventStatus;
  private readonly _authService = inject(AuthService);
  private readonly _editorialDataService = inject(InsightsEditorDataService);

  public breadCrumbItems!: Array<{}>;
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
    { label: EventStatus.NotStarted, class: 'status-not-started' },
    { label: EventStatus.InReview, class: 'status-in-progress' },
    { label: EventStatus.Complete, class: 'status-complete' },
  ];

  public filtered_sessions: Session[] = [];
  public uniqueDays: string[] = [];
  public availableTracks: string[] = [];

  private _keyTakeawayUpdate$ = new Subject<{ text: string; index: number }>();
  private _keyTakeawaysData: Array<string> = [];
  private _realtimeInsightUpdate$ = new Subject<{
    text: string;
    indexI: number;
    indexJ: number;
  }>();
  private _realTimeInsightsData: Array<RealtimeInsight> = [];
  private _insightUpdate$ = new Subject<{ text: string; index: number }>();
  private _insightsData: Array<string> = [];
  private _topicUpdate$ = new Subject<{ text: string; index: number }>();
  private _topicsData: Array<string> = [];

  ngOnInit(): void {
    // BreadCrumb Set
    this.breadCrumbItems = [
      { label: 'Elsa Events' },
      { label: 'Edit Report', active: true },
    ];
    this._editorialDataService.getEventDetails().subscribe((data) => {
      this.getEventDetails();
    });
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

  updateEventReport(): void {
    this.isLoading = true;
    this.dataLoaded = false;
    const data = {
      action: 'getDebriefData',
      sessionIds: [this.selected_session],
      eventName: getLocalStorageItem<string>('SELECTED_EVENT_NAME'),
    };
    this._editorialDataService.getEventReport(data).subscribe({
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
      eventName: getLocalStorageItem<string>('SELECTED_EVENT_NAME'),
    };

    this._editorialDataService.getEventReport(data).subscribe({
      next: (response) => {
        console.log(response);
        if (response?.data?.[0]?.snapshotData) {
          const responseData = response?.data[0];
          this.original_debrief = JSON.parse(JSON.stringify(responseData));
          const data = JSON.parse(responseData.snapshotData);
          this.summary = data['data']['summary'];
          this.insights = data['data']['insights'];
          this._insightsData = clone(this.insights);
          this.topics = data['data']['topics'];
          this._topicsData = clone(this.topics);
          this.keytakeaways = data['data']['key_takeaways'];
          this._keyTakeawaysData = clone(this.keytakeaways);
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
          this._realTimeInsightsData = cloneDeep(this.realtimeinsights);
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
        sessionID && sessionID['Status'] != EventStatus.NotStarted
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
    const status = this.convertStringToEventStatus(
      this.selected_session_details.Status
    );
    this.changeEventStatus(status);
  }

  saveEdits(): void {
    this.postEditedDebrief();
  }

  changeEventStatus(status: EventStatus): void {
    this.isLoading = true;

    this._authService
      .getUserEmail$()
      .pipe(
        switchMap((userEmail: string) => {
          const debrief: ChangeEventStatusRequest = {
            action: 'changeEventStatus',
            sessionId: this.selected_session,
            status: status,
            changeEditMode: true,
            editor: userEmail || '',
          };

          return this._editorialDataService.changeEventStatus(debrief);
        }),
        tap((response) => {
          if (response && response['data']?.status === 'SUCCESS') {
            this.isEditorMode = true;
          } else if (response) {
            this.snackBar.open(
              'Another editor already editing this session!',
              'Close',
              {
                duration: 5000,
                panelClass: ['error-snackbar'],
              }
            );
          }
        }),
        tap(() => this.getEventDetails()),
        finalize(() => {
          this.isLoading = false;
        }),
        catchError((error) => {
          console.error('Error in changeEventStatus:', error);
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  postEditedDebrief(): void {
    this.isLoading = true;
    const data = {
      action: 'updatePostInsights',
      sessionId: this.selected_session,
      updatedData: {
        realtimeinsights: this._realTimeInsightsData,
        summary: this.summary,
        keytakeaways: this._keyTakeawaysData,
        insights: this._insightsData,
        status: this.selected_session_details.Status,
        topics: this._topicsData,
        trends: this.trends,
        postInsightTimestamp: this.postInsightTimestamp,
        trendsTimestamp: this.trendsTimestamp,
      },
      eventName: getLocalStorageItem<string>('SELECTED_EVENT_NAME'),
      domain: getLocalStorageItem<string>('EVENT_LLM_DOMAIN'),
    };

    this._editorialDataService.updatePostInsights(data).subscribe({
      next: (response) => {
        if (response['data'].statusCode == 200) {
          this.isEditorMode = false;
          this.selected_session_details.Editor = '';
          this.getEventDetails();
        }
        this._updateParallelData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.isLoading = false;
      },
    });
  }

  checkSessionLocked(data: any, session_id: string): Observable<boolean> {
    return this._authService.getUserEmail$().pipe(
      map((userEmail: string) => {
        const exist = data.find(
          (session) =>
            session.SessionId === session_id && session.Editing === userEmail
        );
        return isUndefined(exist);
      })
    );
  }

  getEventDetails(): void {
    this._editorialDataService.getEventDetails().subscribe((response: any) => {
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
      session['Status'] === EventStatus.NotStarted ||
      session['Status'] === EventStatus.InProgress
    ) {
      this.showError();
    } else {
      this.selected_session = session['SessionId'];
      const sessionObj = JSON.parse(JSON.stringify(session));
      if (sessionObj.StartsAt) {
        sessionObj.StartsAt = getAbsoluteDate(sessionObj.StartsAt);
      }

      this._authService
        .getUserEmail$()
        .pipe(
          tap((userEmail: string) => {
            if (sessionObj.Editor == userEmail) {
              this.isEditorMode = true;
            } else {
              this.isEditorMode = false;
            }
            this.selected_session_details = sessionObj;
            console.log('Selected session:', session);
          }),
          finalize(() => {
            this.getEventReport();
          })
        )
        .subscribe();
    }
  }

  // Method to dynamically assign a class based on the session's status
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
      default:
        return '';
    }
  }

  removeKeytakeaway(index: number): void {
    this.keytakeaways.splice(index, 1);
    this._keyTakeawaysData.splice(index, 1);
  }

  addNewKeytakeaway(): void {
    this.keytakeaways.push('');
    this._keyTakeawaysData.push('');
  }

  removeInsight(index: number): void {
    this.insights.splice(index, 1);
    this._insightsData.splice(index, 1);
  }

  removeTopic(index: number): void {
    this.topics.splice(index, 1);
    this._topicsData.splice(index, 1);
  }

  addNewInsight(): void {
    this.insights.push('');
    this._insightsData.push('');
  }

  addNewTopic(): void {
    this.topics.push('');
    this._topicsData.push('');
  }

  onKeyTakeawayChange(value: string, index: number): void {
    this._keyTakeawayUpdate$.next({ text: value, index });
  }

  onInsightChange(value: string, index: number): void {
    this._insightUpdate$.next({ text: value, index });
  }

  onRealtimeInsightChange(value: string, indexI: number, indexJ: number): void {
    this._realtimeInsightUpdate$.next({ text: value, indexI, indexJ });
  }

  onTopicChange(value: string, index: number): void {
    this._topicUpdate$.next({ text: value, index });
  }

  openLargeModal(): void {
    const data = {
      type: 'debrief',
      keytakeaways: this._keyTakeawaysData,
      summary: this.summary,
      insights: this._insightsData,
      topics: this._topicsData,
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

  // Please be mindful that this is a shittiest code so don't rely on this for the new changes
  private _updateParallelData(): void {
    this.keytakeaways = clone(this._keyTakeawaysData);
    this.insights = clone(this._insightsData);
    this.topics = clone(this._topicsData);
    this.realtimeinsights = cloneDeep(this._realTimeInsightsData);
  }

  private convertStringToEventStatus(status: string): EventStatus {
    switch (status) {
      case 'NOT_STARTED':
        return EventStatus.NotStarted;
      case 'IN_PROGRESS':
        return EventStatus.InProgress;
      case 'UNDER_REVIEW':
        return EventStatus.UnderReview;
      case 'Completed':
        return EventStatus.Completed;
      default:
        console.warn(`Unknown status: ${status}`);
        return EventStatus.NotStarted;
    }
  }
}

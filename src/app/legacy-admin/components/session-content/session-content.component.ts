import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { BackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { downsampleBuffer, pcmEncode } from '../../helpers/audioUtils';
declare const Buffer;
// TODO: use @smithy/eventstream-codec instead of @aws-sdk/eventstream-marshaller.
// Check - https://www.npmjs.com/package/@aws-sdk/eventstream-marshaller and https://www.npmjs.com/package/@aws-sdk/eventstream-codec
import * as marshaller from '@aws-sdk/eventstream-marshaller'; // for converting binary event stream messages to and from JSON
// TODO: use @smithy/util-utf8 instead of @aws-sdk/util-utf8-node.
// Check - https://www.npmjs.com/package/@aws-sdk/util-utf8-node and https://www.npmjs.com/package/@aws-sdk/util-utf8
import * as util_utf8_node from '@aws-sdk/util-utf8-node'; // utilities for encoding and decoding UTF8
// TODO: Consider replacing microphone-stream with Web Audio API, Recorder.js or MediaRecorder API
import { NgClass } from '@angular/common';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

import { MatIconModule } from '@angular/material/icon';
import { escape } from 'lodash-es';
import MicrophoneStream from 'microphone-stream'; // collect microphone input as a stream of raw bytes
import { ControlPanelComponent } from 'src/app/legacy-admin/@components/control-panel/control-panel.component';
import { ProjectImageSelectionComponent } from 'src/app/legacy-admin/@components/project-image-selection/project-image-selection.component';
import { SessionSelectionComponent } from 'src/app/legacy-admin/@components/session-selection/session-selection.component';
import {
  LiveSessionState,
  ProjectionData,
  SessionDetails,
  SessionStatus,
} from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import {
  ControlPanelState,
  DashboardTabs,
  RightSidebarState,
} from 'src/app/legacy-admin/@models/global-state';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { ProjectionStateService } from 'src/app/legacy-admin/@services/projection-state.service';
import { generateSHA256HashHex } from 'src/app/legacy-admin/@utils/generate-hash';
import { generateUniqueId } from 'src/app/legacy-admin/@utils/generate-uuid';
import { MicrophoneService } from 'src/app/legacy-admin/services/microphone.service';
import { ModalService } from 'src/app/legacy-admin/services/modal.service';
import {
  EventCardType,
  EventDetailType,
  ScreenDisplayType,
  ThemeOptions,
} from 'src/app/legacy-admin/shared/enums';
import { EventDetail, PostData } from 'src/app/legacy-admin/shared/types';

const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);
@Component({
  selector: 'app-session-content',
  templateUrl: './session-content.component.html',
  styleUrls: ['./session-content.component.scss'],
  imports: [
    NgClass,
    MatTabsModule,
    ProjectImageSelectionComponent,
    SessionSelectionComponent,
    ControlPanelComponent,
    MatIconModule,
  ],
})
// TODO:@later refactor this fully
export class SessionContentComponent implements OnInit, OnChanges {
  ScreenDisplayType = ScreenDisplayType;
  @Input() eventControls: PostData;
  @Input() selectedThemeProp: string;
  @Input() selectedEventProp: string;
  @Input() transcriptTimeOutProp: number;

  private readonly _backendApiService = inject(BackendApiService);

  isSessionInProgress = false;
  selectedTheme: string = ThemeOptions.Light;
  selectedEvent = '';
  selectedKeynoteType = '';
  selectedSessionType = '';
  selectedReportType = '';
  selectedDay = '';
  selectedMultiSessionDay = '';
  eventDetails: EventDetail[] = [];
  eventDays: any = [];
  eventNames: any = [];
  selectedSessionTitle = '';
  sessionTitles: string[] = [];
  primarySessionTitles: string[] = [];
  filteredEventData: any = [];
  options: string[] = [];
  selectedOptions: string[] = [];
  dropdownOpen = false;
  sessionIds = [];
  successMessage = '';
  failureMessage = '';
  transctiptToInsides = '';
  timeoutId: any = '';
  currentSessionId = '';
  currentPrimarySessionId = '';
  postInsideInterval = 15;
  transcriptTimeOut = 60;
  lastFiveWords = '';
  startListeningClicked = false;

  /*   */
  title = 'AngularTranscribe';
  languageCode = 'en-US';
  region = 'ca-central-1';
  sampleRate = 44100;
  transcription = '';
  socket;
  micStream;
  socketError = false;
  transcribeException = false;
  errorText: '';
  isStreaming = false;
  selectedDomain = '';

  eventDay: Record<string, string> = {
    [EventCardType.Welcome]: '',
    [EventCardType.ThankYou]: '',
    [EventCardType.Info]: '',
  };

  protected selectedDashboardTab = computed(() =>
    this._globalStateService.selectedDashboardTab()
  );
  protected activeSession = computed(() =>
    this._dashboardFiltersStateService.activeSession()
  );
  protected availableSessions = computed(() =>
    this._dashboardFiltersStateService.availableSessions()
  );
  protected liveEventState = computed(() =>
    this._dashboardFiltersStateService.liveEventState()
  );
  protected liveSessionTranscript = computed(() =>
    this._dashboardFiltersStateService.liveSessionTranscript()
  );
  protected selectedEventName = computed(() =>
    this._dashboardFiltersStateService.selectedEvent()
  );
  protected rightSidebarState = computed(() =>
    this._globalStateService.rightSidebarState()
  );
  protected isControlPanelExpanded = computed(
    () =>
      this._globalStateService.controlPanelState() ===
      ControlPanelState.WidgetExpanded
  );
  protected RightSidebarState = RightSidebarState;
  protected DashboardTabs = DashboardTabs;

  private _isTranscriptParaBreak: boolean = false;

  constructor(
    private modalService: ModalService,
    private micService: MicrophoneService,
    private _globalStateService: GlobalStateService,
    private _dashboardFiltersStateService: DashboardFiltersStateService,
    private _projectionStateService: ProjectionStateService
  ) {
    effect(() => {
      if (
        this.isSessionInProgress &&
        this.activeSession() === null &&
        this.availableSessions()?.length
      ) {
        const currentSession = this.availableSessions().find(
          (aSession) =>
            aSession.metadata['originalContent'].SessionId ===
            this.currentSessionId
        );
        if (currentSession) {
          this._dashboardFiltersStateService.setActiveSession(currentSession);
        }
      }

      if (
        this.isSessionInProgress &&
        this.activeSession() &&
        this.liveEventState() === LiveSessionState.Stopped
      ) {
        if (this.selectedDay !== '' && this.selectedSessionTitle !== '') {
          this.startRecording();
          this.transctiptToInsides = localStorage.getItem(
            'transctiptToInsides'
          );
          this.rotateSessionTitles(this.selectedSessionTitle);
        }
      }
    });
  }

  private _destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.selectedEvent = localStorage.getItem('selectedEvent') || '';
    this.selectedDay = localStorage.getItem('currentDay') || '';
    this.selectedSessionTitle =
      localStorage.getItem('currentSessionTitle') || '';
    this.selectedSessionType =
      localStorage.getItem('selectedSessionType') || '';
    this.currentSessionId = localStorage.getItem('currentSessionId') || '';
    this.selectedDomain =
      localStorage.getItem('domain') ||
      this._globalStateService.getSelectedDomain();
    this.currentPrimarySessionId =
      localStorage.getItem('currentPrimarySessionId') || '';
    this.getEventDetails();
    this.transcriptTimeOut =
      parseInt(localStorage.getItem('transcriptTimeOut')) || 60;
    this.postInsideInterval =
      parseInt(localStorage.getItem('postInsideInterval')) || 15;
    this.lastFiveWords = localStorage.getItem('lastFiveWords');
    this.isSessionInProgress =
      parseInt(localStorage.getItem('isSessionInProgress')) == 1 || false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedThemeProp']) {
      if (
        changes['selectedThemeProp'].currentValue !=
        changes['selectedThemeProp'].previousValue
      ) {
        if (this.selectedTheme != changes['selectedThemeProp'].currentValue) {
          this.selectedTheme = changes['selectedThemeProp'].currentValue;
          this.onThemeChange();
        }
      }
    }

    if (changes['selectedEventProp']) {
      if (
        changes['selectedEventProp'].currentValue !=
        changes['selectedEventProp'].previousValue
      ) {
        this.selectedEvent = changes['selectedEventProp'].currentValue;
      }
    }

    if (changes['transcriptTimeOutProp']) {
      if (
        changes['transcriptTimeOutProp'].currentValue !=
        changes['transcriptTimeOutProp'].previousValue
      ) {
        this.transcriptTimeOut = changes['transcriptTimeOutProp'].currentValue;
      }
    }
  }

  onThemeChange() {
    console.log('theme change', this.selectedTheme);
    const postData: PostData = {};
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.primarySessionId = this.currentPrimarySessionId;
    postData.theme = this.selectedTheme;
    postData.action = 'updateTheme';
    postData.sessionTitle = this.selectedSessionTitle;
    this._backendApiService.postData(postData).subscribe(
      (data: any) => {
        console.log(data);
        this.showSuccessMessage(`Theme color is ${this.selectedTheme}`);
      },
      (error: any) => {
        this.showFailureMessage('Failed to change theme color .', error);
      }
    );
  }

  getEventDetails() {
    this._backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data.data;
      this.selectedDomain = this._globalStateService.getSelectedDomain();
      this.populateEventNames();
      this.selectDefaultOptions();
    });
  }

  selectDefaultOptions() {
    if (!this.selectedEvent && this.eventNames.length > 0) {
      this.selectedEvent = this.eventNames[0];
    }
    this.populateEventDays();
    if (!this.selectedDay && this.eventDays.length > 0) {
      this.selectedDay = this.eventDays[0];
    }
    if (!this.selectedMultiSessionDay && this.eventDays.length > 0) {
      this.selectedMultiSessionDay = this.eventDays[0];
    }
    this.populateSessionTitles();
    this.populatePrimarySessionTitles();
    if (!this.selectedSessionTitle && this.sessionTitles.length > 0) {
      this.selectedSessionTitle = this.sessionTitles[0];
      const session = this.findSession(
        this.selectedEvent,
        this.selectedSessionTitle
      );
      this.selectedSessionType = session.Type;
      localStorage.setItem(
        'selectedSessionType',
        this.selectedSessionType.toString()
      );
    }

    if (!this.selectedOptions.length && this.primarySessionTitles.length > 0) {
      this.selectedOptions = [this.primarySessionTitles[0]];
    }
  }

  handleSessionsChange = ({ values }: { values: string[] }) => {
    this.selectedOptions = values;
  };

  handleMainSessionDayChange = (dayValue: string) => {
    this.selectedDay = dayValue;
    this.populateSessionTitles();
  };

  handleMultiSessionDayChange = (dayValue: string) => {
    this.selectedMultiSessionDay = dayValue;
    this.populatePrimarySessionTitles();
  };

  handleEventSpecificDayChange = (dayObject: Record<string, string>) => {
    this.eventDay = dayObject;
  };

  populateEventNames() {
    this.eventNames = Array.from(
      new Set(this.eventDetails.map((event) => event.Event))
    );
  }

  populateEventDays() {
    const filteredByEvent = this.eventDetails.filter(
      (event) => event.Event === this.selectedEvent
    );
    this.eventDays = Array.from(
      new Set(filteredByEvent.map((event) => event.EventDay))
    );
  }

  populateSessionTitles() {
    const filteredByDay = this.eventDetails.filter(
      (event) =>
        event.Event === this.selectedEvent &&
        event.EventDay === this.selectedDay
    );
    filteredByDay.sort((a, b) => a.sid - b.sid);
    this.sessionTitles = filteredByDay.map((event) => event.SessionTitle);
    this.options = this.sessionTitles;
  }

  rotateSessionTitles(currentSession: string): void {
    const index = this.sessionTitles.indexOf(currentSession);

    if (index === -1) {
      return;
    }
    this.sessionTitles = [
      ...this.sessionTitles.slice(index),
      ...this.sessionTitles.slice(0, index),
    ];
  }

  populatePrimarySessionTitles() {
    const filteredByDay = this.eventDetails.filter(
      (event) =>
        event.Event === this.selectedEvent &&
        event.EventDay === this.selectedMultiSessionDay &&
        event.Type === EventDetailType.PrimarySession
    );
    filteredByDay.sort((a, b) => a.sid - b.sid);
    this.primarySessionTitles = filteredByDay.map(
      (event) => event.SessionTitle
    );
  }

  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  private showFailureMessage(message: string, error: any): void {
    this.failureMessage = message;
    setTimeout(() => {
      this.failureMessage = '';
    }, 5000);
  }
  showWelcomeMessageBanner(screenIdentifier: string): void {
    const postData: PostData = {};
    postData.action = 'welcome';
    postData.eventName = this.selectedEvent;
    postData.day = this.eventDay[EventCardType.Welcome];

    this.postData(
      postData,
      screenIdentifier,
      'Welcome message screen sent successfully!',
      'Failed to send welcome message.'
    );
  }

  showThankYouScreen(screenIdentifier: string): void {
    const postData: PostData = {};
    postData.action = 'thankYou';
    postData.day = this.eventDay[EventCardType.ThankYou];
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.postData(
      postData,
      screenIdentifier,
      'Thank you message sent successfully!',
      'Failed to send thank you message.'
    );
  }

  //it is qr screen
  showInfoScreen(screenIdentifier: string): void {
    const postData: PostData = {};
    postData.action = 'qrScreen';
    postData.day = this.eventDay[EventCardType.Info];
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.postData(
      postData,
      screenIdentifier,
      'Qr message sent successfully!',
      'Failed to send qr message.'
    );
  }

  findSession = (event: string, SessionTitle: string) => {
    const session = this.eventDetails.find(
      (session: { Event: string; SessionTitle: string }) =>
        session.Event === event && session.SessionTitle === SessionTitle
    );
    return session ? session : null;
  };

  findSessionById = (event: string, SessionId: string) => {
    const session = this.eventDetails.find(
      (session: { Event: string; SessionId: string }) =>
        session.Event === event && session.SessionId === SessionId
    );
    return session ? session : null;
  };

  showBackupScreen(): void {
    const postData: PostData = {};
    postData.action = 'backup_screen';
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this._backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('Backup message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send backup message.', error);
      }
    );
  }

  showEndEvent() {
    const postData: PostData = {};
    postData.action = 'thankyou';
    postData.day = 'endEvent';
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this._backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('End event message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send end event message.', error);
      }
    );
  }

  onSteamStart(): void {
    // Here I have not refactored the behaviour due to time constraints.
    // But later we can remove almost all the variables / states used here - @naveen
    // Same. Me too - @saiyaff
    const currentSession = this.activeSession().metadata[
      'originalContent'
    ] as SessionDetails;

    this.selectedDay = currentSession.EventDay;
    this.selectedSessionTitle = currentSession.SessionTitle;
    this.selectedEvent = currentSession.Event;

    this.startListening(currentSession);
  }

  onStreamPause(): void {
    const currentSession = this.activeSession().metadata[
      'originalContent'
    ] as SessionDetails;
    this.stopListening(currentSession);
  }

  onStreamStop(): void {
    this.endSessionPopUpPostInsights();
  }

  async startListening(session: SessionDetails): Promise<void> {
    this.modalService.close();
    const hasPermission =
      await this.micService.checkAndRequestMicrophonePermission();

    if (hasPermission) {
      if (
        this.selectedDay !== '' &&
        this.selectedSessionTitle !== '' &&
        this.selectedDomain !== '' &&
        this.selectedEvent !== ''
      ) {
        localStorage.setItem('currentSessionTitle', this.selectedSessionTitle);
        localStorage.setItem('currentSessionId', session.SessionId);
        localStorage.setItem(
          'currentPrimarySessionId',
          session.PrimarySessionId
        );
        localStorage.setItem('currentDay', this.selectedDay);
        localStorage.setItem('selectedEvent', this.selectedEvent);
        localStorage.setItem('domain', this.selectedDomain);
        localStorage.setItem('isSessionInProgress', '1');

        this.isSessionInProgress = true;

        this.startRecording();

        this._backendApiService
          .postCurrentSessionId(
            session.SessionId,
            this.selectedEvent,
            this.selectedDomain,
            session.PrimarySessionId
          )
          .subscribe({
            next: (data: any) => {
              console.log(data);
              this.startListeningClicked = true;
              this.showSuccessMessage(
                'Start session message sent successfully!'
              );
            },
            error: (error: any) => {
              this.showFailureMessage(
                'Failed to send start session message.',
                error
              );
            },
          });
        if (session.Type == 'BreakoutSession') {
          this.showBreakdownInProgress(session);
        } else {
          this.showListeningInsights(session);
        }
      } else {
        this.modalService.open(
          'Confirm Action',
          'Please select the Event , Day , Domain and Speaker Name to start the session',
          'ok',
          () => {},
          this.handleNoSelect
        );
      }
    } else {
      console.log('Microphone permission denied');
      this.modalService.open(
        'Confirm Action',
        'Please allow permission to browser microphone services',
        'ok',
        () => {},
        this.handleNoSelect
      );
    }
  }

  handleNoSelect = () => {
    this.modalService.close();
  };

  showListeningInsights(sessionDetails: SessionDetails) {
    const postData: PostData = {};
    if (this.selectedSessionTitle != '') {
      if (sessionDetails.Type == 'BreakoutSession') {
        this.modalService.open(
          'Confirm Action',
          "Breakout session don't have speaker name screen",
          'ok',
          () => {},
          this.handleNoSelect
        );
      } else {
        postData.day = this.selectedDay;
        postData.eventName = this.selectedEvent;
        postData.domain = this.selectedDomain;
        postData.action = 'liveInsightsListening';
        postData.sessionTitle = sessionDetails.SessionSubject;
        this.postData(postData, null, null, null);
      }
    } else {
      this.modalService.open(
        'Confirm Action',
        "Breakout session don't have Real-time Insights Screen",
        'ok',
        () => {},
        this.handleNoSelect
      );
    }
  }

  showPausedInsights(sessionDetails: SessionDetails) {
    const postData: PostData = {};

    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.action = 'listeningPaused';
    postData.sessionTitle = sessionDetails.SessionSubject;

    this.postData(postData);
  }

  showBreakdownInProgress(sessionDetails: SessionDetails) {
    const postData: PostData = {};

    const primarySession = this.findSessionById(
      sessionDetails.Event,
      sessionDetails.PrimarySessionId
    );
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.action = 'breakOutSessionListening';
    postData.sessionTitle = primarySession.SessionSubject;
    this._backendApiService.postData(postData).subscribe(() => {});
  }

  showPostInsightsLoading(sessionDetails: SessionDetails): void {
    const postData: PostData = {};
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.action = 'postInsightsLoading';
    postData.sessionTitle = sessionDetails.SessionSubject;
    this._backendApiService.postData(postData).subscribe(() => {});
  }

  stopListening(session: SessionDetails): void {
    console.log('sessionId for stop session', session);
    this.modalService.open(
      'Pause Session?',
      'Are you sure to pause the session?',
      'yes_no',
      () => {
        this.closeSocket();
        this.showPausedInsights(session);
      },
      this.handleNoSelect
    );
  }

  endEvent(): void {
    const postData: PostData = {};
    postData.action = 'thankYou';
    postData.day = 'endEvent';
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this._backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('End event message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send end event message.', error);
      }
    );
  }

  endSessionPopUpPostInsights = () => {
    let endText =
      'Are you sure that you want to end current session? This will display post session insights on screen.';

    if (this.selectedSessionType === EventDetailType.BreakoutSession) {
      endText = 'Are you sure that you want to end current breakout session?';
    } else if (this.selectedSessionType === EventDetailType.IntroSession) {
      endText = 'Are you sure that you want to end current intro session?';
    }
    this.modalService.open(
      'End Session?',
      endText,
      'yes_no',
      this.endSession,
      this.handleNoSelect
    );
  };

  endSession = (): void => {
    this.modalService.close();
    this.startListeningClicked = false;
    const session = this.activeSession()?.metadata[
      'originalContent'
    ] as SessionDetails;

    if (!session) {
      this.cleanupSessionState();
      return;
    }

    const postData: PostData = {};

    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.sessionId = session.SessionId;
    postData.primarySessionId = session.PrimarySessionId;
    postData.sessionTitle = session.SessionSubject;
    postData.sessionDescription = session.SessionDescription;
    this.isSessionInProgress = false;

    this.cleanupSessionState();
    if (session.Type == EventDetailType.BreakoutSession) {
      postData.action = 'endBreakoutSession';
      this._backendApiService.postData(postData).subscribe(
        (data: any) => {
          this.showSuccessMessage(
            'End breakout session message sent successfully!'
          );
        },
        (error: any) => {
          this.showFailureMessage(
            'Failed to send end breakout session message.',
            error
          );
        }
      );
    } else if (session.Type == EventDetailType.PrimarySession) {
      postData.action = 'endPrimarySession';
      this._backendApiService.postData(postData).subscribe(
        (data: any) => {
          this.showSuccessMessage('End session message sent successfully!');
          this.showPostInsightsLoading(session);
        },
        (error: any) => {
          this.showFailureMessage('Failed to send end session message.', error);
        }
      );
    } else {
      postData.action = 'endSession';
      this._backendApiService.postData(postData).subscribe(
        (data: any) => {
          this.showSuccessMessage('End session message sent successfully!');
          this.showPostInsightsLoading(session);
        },
        (error: any) => {
          this.showFailureMessage('Failed to send end session message.', error);
        }
      );
    }
    this.closeSocket();
    this.clearSessionData();

    this.ensureControlPanelClosed();
  };

  private cleanupSessionState(): void {
    this._globalStateService.setControlPanelState(
      ControlPanelState.WidgetCollapsed
    );
    this._dashboardFiltersStateService.setLiveEvent(null);
    this._globalStateService.setRightSidebarState(RightSidebarState.Hidden);
  }

  private ensureControlPanelClosed(): void {
    if (
      this._globalStateService.controlPanelState() !==
      ControlPanelState.WidgetCollapsed
    ) {
      this._globalStateService.setControlPanelState(
        ControlPanelState.WidgetCollapsed
      );
    }
  }

  showSummary(screenIdentifier: string): void {
    // Check if a keynote type is selected
    this.sessionIds = [];
    if (this.selectedOptions.length <= 0) {
      this.modalService.open(
        'Confirm Action',
        'select the sessions to show the summary!',
        'ok',
        () => {},
        this.handleNoSelect
      );
      return;
    } else {
      this.selectedOptions.forEach((element) => {
        const session = this.findSession(this.selectedEvent, element);
        this.sessionIds.push(session.SessionId);
      });
      const postData: PostData = {};
      postData.action = 'displayPostEventInsights';
      postData.day = this.selectedMultiSessionDay;
      postData.eventName = this.selectedEvent;
      postData.domain = this.selectedDomain;
      postData.sessionIds = this.sessionIds;
      this.postData(
        postData,
        screenIdentifier,
        'Single keynote message sent successfully!',
        'Failed to send single keynote message.'
      );
    }
  }

  showDailySummary(screenIdentifier: string, selectedDays: string[]): void {
    if (selectedDays.length <= 0) {
      this.modalService.open(
        'Confirm Action',
        'select the sessions to show the daily summary!',
        'ok',
        () => {},
        this.handleNoSelect
      );
      return;
    } else {
      const postData: PostData = {};
      postData.action = 'displayPostEventDebrief';
      postData.eventName = this.selectedEvent;
      postData.domain = this.selectedDomain;
      postData.debriefFilter = selectedDays;
      postData.sessionId = '';
      postData.screenTimeout = 60;
      postData.debriefType = 'DAILY';

      this.postData(
        postData,
        screenIdentifier,
        'Daily debrief message sent successfully!',
        'Failed to send daily debrief message.'
      );
    }
  }

  realtimeInsides(transcript: string) {
    if (this.transctiptToInsides === '') {
      this.setTimerToPushTranscript();
    }

    this.transctiptToInsides += transcript;
    localStorage.setItem('transctiptToInsides', this.transctiptToInsides);

    const words = this.transctiptToInsides.split(/\s+/);
    const wordCount = words.length;

    if (wordCount > 100) {
      // Clear existing timer
      console.log('1 minute 100 completed ');
      this.hitBackendApiAndReset();
    }
  }

  setTimerToPushTranscript() {
    clearInterval(this.timeoutId);
    console.log('1 minute reset ', this.transcriptTimeOut);
    this.timeoutId = setTimeout(
      () => {
        console.log('1 minute completed');
        this.hitBackendApiAndReset();
      },
      this.transcriptTimeOut * 1000 || 60000
    );
  }

  hitBackendApiAndReset() {
    this.sendTranscriptToBackend(
      this.lastFiveWords + ' ' + this.transctiptToInsides
    );
    const words = this.transctiptToInsides.split(/\s+/);
    this.lastFiveWords = this.getLastFiveWords(words);
    this.transctiptToInsides = '';
    localStorage.setItem('lastFiveWords', this.lastFiveWords);
    localStorage.setItem('transctiptToInsides', this.transctiptToInsides);
    clearInterval(this.timeoutId);
  }

  sendTranscriptToBackend(transcript: string) {
    this.getRealTimeInsights(transcript);
  }

  getLastFiveWords(words: string[]): string {
    return words.slice(-5).join(' ');
  }

  getRealTimeInsights(transcript: string) {
    const postData: PostData = {};
    const sessionDetails = this.activeSession().metadata[
      'originalContent'
    ] as SessionDetails;
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.primarySessionId = this.currentPrimarySessionId;
    postData.sessionId = this.currentSessionId;
    postData.action = 'realTimeInsights';
    postData.sessionTitle = sessionDetails.SessionSubject;
    postData.transcript = transcript;
    postData.sessionDescription = sessionDetails.SessionDescription;
    this._backendApiService.postData(postData).subscribe(() => {
      // Handle success or error if needed
    });
  }

  onPostInsideIntervalChange() {
    // This function will be triggered whenever the value of postInsideInterval changes
    console.log('postInsideInterval changed to:', this.postInsideInterval);
    localStorage.setItem(
      'postInsideInterval',
      this.postInsideInterval.toString()
    );

    // You can call any other functions or perform any other actions here
  }

  onTranscriptTimeOutChange() {
    // This function will be triggered whenever the value of transcriptTimeOut changes
    console.log('transcriptTimeOut changed to:', this.transcriptTimeOut);
    localStorage.setItem(
      'transcriptTimeOut',
      this.transcriptTimeOut.toString()
    );
    // You can call any other functions or perform any other actions here
  }
  //***************************************
  startRecording() {
    this.isStreaming = !this.isStreaming;
    console.log('recording');
    window.navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })

      // ...then we convert the mic stream to binary event stream messages when the promise resolves
      .then(this.streamAudioToWebSocket)
      .catch(function (error) {
        console.log(
          'There was an error streaming your audio to Amazon Transcribe. Please try again.',
          error
        );
      });
  }
  streamAudioToWebSocket = (userMediaStream) => {
    //let's get the mic input from the browser, via the microphone-stream module
    this.startListeningClicked = true;

    // update global state
    this._dashboardFiltersStateService.setLiveEvent(
      this.activeSession().metadata['originalContent']
    );
    if (this.rightSidebarState() === RightSidebarState.Hidden) {
      this._globalStateService.setRightSidebarState(
        RightSidebarState.Collapsed
      );
    }

    console.log('start streamAudioToWebSocket');
    this.micStream = new MicrophoneStream();
    this.micStream.setStream(userMediaStream);
    console.log('start streamAudioToWebSocket22222');
    // Pre-signed URLs are a way to authenticate a request (or WebSocket connection, in this case)
    // via Query Parameters. Learn more: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
    this.createPresignedUrlNew();
    console.log('start streamAudioToWebSocket333333');
  };

  openWebsocketAndStartStream(preSignedUrl: any) {
    console.log('inside openWebsocketAndStartStream', preSignedUrl);
    //open up our WebSocket connection
    this.socket = new WebSocket(preSignedUrl);
    this.socket.binaryType = 'arraybuffer';
    console.log('start streamAudioToWebSocket44444');
    // when we get audio data from the mic, send it to the WebSocket if possible
    this.socket.onopen = () => {
      this.micStream.on('data', (rawAudioChunk) => {
        // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
        const binary = this.convertAudioToBinaryMessage(rawAudioChunk);

        if (this.isSessionInProgress && this.socket.OPEN) {
          this.socket.send(binary);
        }
      });
    };
    console.log('start streamAudioToWebSocket5555');
    // handle messages, errors, and close events
    this.wireSocketEvents();
  }
  createPresignedUrlNew = async () => {
    const body = {
      method: 'GET',
      endpoint: 'transcribestreaming.' + this.region + '.amazonaws.com:8443',
      path: '/stream-transcription-websocket',
      service: 'transcribe',
      hash: await generateSHA256HashHex(''),
      options: {
        protocol: 'wss',
        expires: 15,
        region: 'ca-central-1',
        query:
          'language-code=' +
          this.languageCode +
          '&media-encoding=pcm&sample-rate=' +
          this.sampleRate,
      },
    };
    await this._backendApiService
      .getTranscriberPreSignedUrl(body)
      .subscribe((data: any) => {
        console.log('inside  createPresignedUrlNew', JSON.stringify(data));
        const url = data.data;
        this.openWebsocketAndStartStream(url);
      });
  };
  getAudioEventMessage = (buffer) =>
    // wrap the audio data in a JSON envelope
    ({
      headers: {
        ':message-type': { type: 'string', value: 'event' },
        ':event-type': { type: 'string', value: 'AudioEvent' },
      },
      body: buffer,
    });
  convertAudioToBinaryMessage = (audioChunk) => {
    const raw = MicrophoneStream.toRaw(audioChunk);

    if (raw == null) return null;

    // downsample and convert the raw audio bytes to PCM
    const downsampledBuffer = downsampleBuffer(raw, this.sampleRate);
    const pcmEncodedBuffer = pcmEncode(downsampledBuffer);

    // add the right JSON headers and structure to the message
    const audioEventMessage = this.getAudioEventMessage(
      Buffer.from(pcmEncodedBuffer)
    );

    //convert the JSON object + headers into a binary event stream message
    // @ts-ignore
    const binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
  };

  closeSocket = () => {
    this.modalService.close();
    localStorage.setItem('isSessionInProgress', '0');
    this.isSessionInProgress = false;
    if (this.socket.OPEN) {
      this.micStream.stop();

      // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
      const emptyMessage = this.getAudioEventMessage(
        Buffer.from(new Buffer([]))
      );
      // @ts-ignore
      const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
      this.socket.send(emptyBuffer);
    }
    clearInterval(this.timeoutId);
    this.startListeningClicked = false;
    this.isStreaming = !this.isStreaming;

    this._dashboardFiltersStateService.setLiveSessionState(
      LiveSessionState.Paused
    );
  };

  clearSessionData = () => {
    clearInterval(this.timeoutId);
    this.startListeningClicked = false;
    localStorage.setItem('isSessionInProgress', '0');
    this.isSessionInProgress = false;
    localStorage.removeItem('currentSessionTitle');
    localStorage.removeItem('selectedSessionType');
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('currentPrimarySessionId');
    localStorage.removeItem('selectedEvent');
    localStorage.removeItem('lastFiveWords');
    this.transctiptToInsides = '';
    this.isStreaming = false;
  };

  handleEventStreamMessage = (messageJson) => {
    const sessionDetails = this.activeSession().metadata[
      'originalContent'
    ] as SessionDetails;
    const results = messageJson.Transcript.Results;
    console.log(
      'messageJSON got from the transcribe',
      JSON.stringify(messageJson)
    );
    if (results.length > 0) {
      if (results[0].Alternatives.length > 0) {
        let transcript = results[0].Alternatives[0].Transcript;

        // fix encoding for accented characters
        transcript = decodeURIComponent(escape(transcript));
        // let currentTranscript = this.love
        const existingTranscript = structuredClone(
          this.liveSessionTranscript()
        );
        if (existingTranscript?.length === 0) {
          existingTranscript.push({ key: generateUniqueId(), value: '' });
        }
        // if this transcript segment is final, add it to the overall transcription
        if (!results[0].IsPartial) {
          console.log('naveen break------------', results);
          existingTranscript.push({ key: generateUniqueId(), value: '' });
          this._isTranscriptParaBreak = true;
          //scroll the textarea down
          this.transcription = transcript;
          // this.transcription += transcript + '\n';
          console.log('current session id:', this.currentSessionId);

          if (sessionDetails) {
            this._backendApiService.putTranscript(this.transcription).subscribe(
              (data: any) => {
                console.log(data);
              },
              (error: any) => {
                this.showFailureMessage('Failed to store transcript', error);
              }
            );
          }
          if (sessionDetails.GenerateInsights) {
            this.realtimeInsides(this.transcription);
          }
        }

        if (this._isTranscriptParaBreak) {
          this._isTranscriptParaBreak = false;
          existingTranscript[existingTranscript?.length - 2].value = transcript;
        } else {
          existingTranscript[existingTranscript?.length - 1].value = transcript;
        }

        this._dashboardFiltersStateService.setLiveSessionTranscript(
          existingTranscript
        );
      }
    }
  };
  wireSocketEvents = () => {
    // handle inbound messages from Amazon Transcribe
    this.socket.onmessage = (message) => {
      //convert the binary event stream message to JSON
      const messageWrapper = eventStreamMarshaller.unmarshall(
        Buffer(message.data)
      );
      const messageBody = JSON.parse(
        String.fromCharCode.apply(String, messageWrapper.body)
      );
      if (
        this.isSessionInProgress &&
        messageWrapper.headers[':message-type'].value === 'event'
      ) {
        this.handleEventStreamMessage(messageBody);
      } else {
        this.transcribeException = true;
        console.log(messageBody.Message);
        // toggleStartStop();
      }
    };

    this.socket.onerror = function () {
      this.socketError = true;
      console.log('WebSocket connection error. Try again.');
      // toggleStartStop();
    };

    this.socket.onclose = (closeEvent) => {
      this.micStream.stop();

      // the close event immediately follows the error event; only handle one.
      if (!this.socketError && !this.transcribeException) {
        if (closeEvent.code != 1000) {
          console.log('error' + closeEvent.reason);
        }
        // toggleStartStop();
      }
    };
  };
  //***************************************

  onTabChange(event: MatTabChangeEvent) {
    if (event.index === 0) {
      this._globalStateService.setSelectedDashboardTab(
        DashboardTabs.SessionSpecific
      );
    } else {
      this._globalStateService.setSelectedDashboardTab(
        DashboardTabs.ProjectSpecific
      );
      this._dashboardFiltersStateService.setShouldFetchEventDetails(true);
    }
  }

  onProjectToScreenClick(data: ProjectionData) {
    this._projectScreen(data);
  }

  private postData(
    postData: PostData,
    identifier?: string,
    successMessage?: string,
    errorMessage?: string
  ) {
    this._backendApiService.postData(postData).subscribe({
      next: () => {
        if (successMessage) {
          this.showSuccessMessage(successMessage);
        }
        if (identifier) {
          this._projectionStateService.toggleProjectingState(identifier);
        }
      },
      error: (error: any) => {
        if (errorMessage) {
          this.showFailureMessage(errorMessage, error);
        }
        if (identifier) {
          this._projectionStateService.toggleProjectingState(identifier);
        }
      },
    });
  }

  private _projectScreen(data: ProjectionData) {
    switch (data.identifier) {
      case 'event_info': {
        this.selectedEvent = this.selectedEventName().label;
        this.eventDay[EventCardType.Info] = data.selectedDays[0] ?? '';
        this.showInfoScreen(data.identifier);
        return;
      }
      case 'welcome_message': {
        this.selectedEvent = this.selectedEventName().label;
        this.eventDay[EventCardType.Welcome] = data.selectedDays[0];
        this.showWelcomeMessageBanner(data.identifier);
        return;
      }
      case 'thank_you_message': {
        this.selectedEvent = this.selectedEventName().label;
        this.eventDay[EventCardType.ThankYou] = data.selectedDays[0];
        this.showThankYouScreen(data.identifier);
        return;
      }
      case 'past_session_debriefs': {
        this.selectedEvent = this.selectedEventName().label;
        this.selectedOptions = Array.from(
          new Set(
            this.availableSessions()
              .filter(
                (aSession) =>
                  data.selectedTracks.includes(
                    aSession.metadata['originalContent'].Track
                  ) &&
                  ![
                    SessionStatus.InProgress,
                    SessionStatus.NotStarted,
                  ].includes(aSession.metadata['originalContent'].Status)
              )
              .map(
                (aSession) => aSession.metadata['originalContent'].SessionTitle
              )
          )
        );
        this.selectedMultiSessionDay = undefined; // hardcoded since it's no longer in use but required from BE
        this.showSummary(data.identifier);
        return;
      }
      case 'daily_debriefs': {
        this.selectedEvent = this.selectedEventName().label;
        this.showDailySummary(data.identifier, data.selectedDays);
        return;
      }
    }
  }
}

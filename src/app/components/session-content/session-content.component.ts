import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { BackendApiService } from 'src/app/services/backend-api.service';
declare const Buffer;
import { pcmEncode, downsampleBuffer } from '../../helpers/audioUtils';
import * as createHash from 'create-hash';
import * as marshaller from '@aws-sdk/eventstream-marshaller'; // for converting binary event stream messages to and from JSON
import * as util_utf8_node from '@aws-sdk/util-utf8-node'; // utilities for encoding and decoding UTF8
import MicrophoneStream from 'microphone-stream'; // collect microphone input as a stream of raw bytes
import { PostData } from 'src/app/shared/types';
import { EventCardType, EventDetailType, ScreenDisplayType, ThemeOptions } from 'src/app/shared/enums';
import { ModalService } from 'src/app/services/modal.service';

const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);
@Component({
  selector: 'app-session-content',
  templateUrl: './session-content.component.html',
  styleUrls: ['./session-content.component.css'],
})
export class SessionContentComponent implements OnInit {
  ScreenDisplayType = ScreenDisplayType;
  @Input() eventControls: PostData;
  @Input() selectedThemeProp: string;
  @Input() selectedEventProp: string;
  @Input() transcriptTimeOutProp: string;

  isSessionInProgress: boolean = false;
  selectedTheme: string = ThemeOptions.light;
  selectedEvent: string = '';
  selectedKeynoteType: string = '';
  selectedSessionType: string = '';
  selectedReportType: string = '';
  selectedDay: string = '';
  selectedMultiSessionDay: string = '';
  eventDetails: any = [];
  eventDays: any = [];
  eventNames: any = [];
  selectedSessionTitle: string = '';
  sessionTitles: string[] = [];
  primarySessionTitles: string[] = [];
  filteredEventData: any = [];
  options: string[] = [];
  selectedOptions: string[] = [];
  dropdownOpen: boolean = false;
  sessionIds = [];
  successMessage: string = '';
  failureMessage: string = '';
  transctiptToInsides: string = '';
  timeoutId: any = '';
  currentSessionId = '';
  currentPrimarySessionId = '';
  postInsideInterval: number = 15;
  transcriptTimeOut: number = 60;
  lastFiveWords: string = '';
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
  selectedDomain: string = 'Healthcare';

  eventDay: { [key: string]: string } = {
    [EventCardType.Welcome]: '',
    [EventCardType.ThankYou]: '',
    [EventCardType.Info]: '',
  };

  event_cards = [
    {
      cardType: EventCardType.Welcome,
      title: 'Welcome Screen',
      imageUrl: '../../../assets/admin screen/welcomw_screen.svg',
      displayFunction: () => this.showWelcomeMessageBanner(),
    },
    {
      cardType: EventCardType.ThankYou,
      title: 'Thank You Screen',
      imageUrl: '../../../assets/admin screen/thank_you_page.svg',
      displayFunction: () => this.showThankYouScreen(),
    },
    {
      cardType: EventCardType.Info,
      title: 'Info Screen',
      imageUrl: '../../../assets/admin screen/qr_screen.svg',
      displayFunction: () => this.showInfoScreen(),
    },
  ];
  session_cards = [
    {
      title: 'Title & Speaker Name Screen',
      imageUrl: '../../../assets/admin screen/moderator_screen.svg',
      displayFunction: () => this.showKeyNote(),
    },
    {
      title: 'Real-time Insights Screen',
      imageUrl: '../../../assets/admin screen/realtime_screen.svg',
      displayFunction: () => this.showLoadingInsights(),
    },
    {
      title: 'Post Session Insights Screens',
      imageUrl: '../../../assets/admin screen/summary_screen.svg',
      icon: '../../../assets/admin screen/note.svg',
      displayFunction: () => this.endSessionPopUpPostInsights(),
    },
  ];
  multi_session_card = [
    {
      title: 'Post Session Insights Screens',
      imageUrl: '../../../assets/admin screen/summary_screen.svg',
      icon: '../../../assets/admin screen/note.svg',
      displayFunction: () => this.showSummary(),
    },
  ];

  constructor(
    private backendApiService: BackendApiService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.selectedEvent = localStorage.getItem('selectedEvent') || '';
    this.selectedDay = localStorage.getItem('currentDay') || '';
    this.selectedSessionTitle = localStorage.getItem('currentSessionTitle') || '';
    this.currentSessionId = localStorage.getItem('currentSessionId') || '';
    this.selectedDomain = localStorage.getItem('domain') || 'Healthcare';
    this.currentPrimarySessionId = localStorage.getItem('currentPrimarySessionId') || '';
    this.getEventDetails();
    this.transcriptTimeOut = parseInt(localStorage.getItem('transcriptTimeOut')) || 60;
    this.postInsideInterval = parseInt(localStorage.getItem('postInsideInterval')) || 15;
    this.lastFiveWords = localStorage.getItem('lastFiveWords');
    this.isSessionInProgress = parseInt(localStorage.getItem('isSessionInProgress')) == 1 || false;
    if (this.selectedDay !== '' && this.selectedSessionTitle !== '') {
      this.startRecording();
      this.transctiptToInsides = localStorage.getItem('transctiptToInsides');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedThemeProp']) {
      if (changes['selectedThemeProp'].currentValue != changes['selectedThemeProp'].previousValue) {
        if (this.selectedTheme != changes['selectedThemeProp'].currentValue) {
          this.selectedTheme = changes['selectedThemeProp'].currentValue;
          this.onThemeChange();
        }
      }
    }

    if (changes['selectedEventProp']) {
      if (changes['selectedEventProp'].currentValue != changes['selectedEventProp'].previousValue) {
        this.selectedEvent = changes['selectedEventProp'].currentValue;
      }
    }

    if (changes['transcriptTimeOutProp']) {
      if (changes['transcriptTimeOutProp'].currentValue != changes['transcriptTimeOutProp'].previousValue) {
        this.transcriptTimeOut = changes['transcriptTimeOutProp'].currentValue;
      }
    }
  }

  onThemeChange() {
    console.log('theme change', this.selectedTheme);
    let postData: PostData = {};
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.primarySessionId = this.currentPrimarySessionId;
    postData.theme = this.selectedTheme;
    postData.action = 'updateTheme';
    postData.sessionTitle = this.selectedSessionTitle;
    this.backendApiService.postData(postData).subscribe(
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
    this.backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data;
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
    }

    if (!this.selectedOptions.length && this.primarySessionTitles.length > 0) {
      this.selectedOptions = [this.primarySessionTitles[0]];
    }
  }

  handleMainSessionChange = (titleValue: string) => {
    this.selectedSessionTitle = titleValue;
  };

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

  handleEventSpecificDayChange = (dayObject: { [key: string]: string }) => {
    this.eventDay = dayObject;
  };

  populateEventNames() {
    this.eventNames = Array.from(new Set(this.eventDetails.map(event => event.Event)));
  }

  populateEventDays() {
    const filteredByEvent = this.eventDetails.filter(event => event.Event === this.selectedEvent);
    this.eventDays = Array.from(new Set(filteredByEvent.map(event => event.EventDay)));
  }

  populateSessionTitles() {
    const filteredByDay = this.eventDetails.filter(
      event => event.Event === this.selectedEvent && event.EventDay === this.selectedDay
    );
    filteredByDay.sort((a, b) => a.sid - b.sid);
    this.sessionTitles = filteredByDay.map(event => event.SessionTitle);
    this.options = this.sessionTitles;
  }

  populatePrimarySessionTitles() {
    const filteredByDay = this.eventDetails.filter(
      event =>
        event.Event === this.selectedEvent &&
        event.EventDay === this.selectedMultiSessionDay &&
        event.Type === EventDetailType.PrimarySession
    );
    filteredByDay.sort((a, b) => a.sid - b.sid);
    this.primarySessionTitles = filteredByDay.map(event => event.SessionTitle);
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
  showWelcomeMessageBanner(): void {
    let postData: PostData = {};
    postData.action = 'welcome';
    postData.day = this.eventDay[EventCardType.Welcome];
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('Welcome message screen sent successfully!');
      },
      (error: any) => {
        this.showFailureMessage('Failed to send welcome message.', error);
      }
    );
  }
  showSnapshot(): void {
    const sessionDetails = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    let postData: PostData = {};
    postData.action = 'snapshot';
    postData.day = this.selectedDay;
    postData.sessionId = sessionDetails.SessionId;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.primarySessionId = this.currentPrimarySessionId;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('Snapshot message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send snapshot message.', error);
      }
    );
  }

  showThankYouScreen(): void {
    let postData: PostData = {};
    postData.action = 'thank_you';
    postData.day = this.eventDay[EventCardType.ThankYou];
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('Thank you message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send thank you message.', error);
      }
    );
  }

  //it is qr screen
  showInfoScreen(): void {
    let postData: PostData = {};
    postData.action = 'qr_screen';
    postData.day = this.eventDay[EventCardType.Info];
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        console.log(data);
        this.showSuccessMessage('Qr message sent successfully!');
      },
      (error: any) => {
        this.showFailureMessage('Failed to send qr message.', error);
      }
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
    let postData: PostData = {};
    postData.action = 'backup_screen';
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('Backup message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send backup message.', error);
      }
    );
  }

  showKeyNote() {
    if (this.selectedDay != '' && this.selectedSessionTitle != '') {
      const sessionDetails = this.findSession(this.selectedEvent, this.selectedSessionTitle);
      if (sessionDetails.Type == 'BreakoutSession') {
        this.modalService.open(
          'Confirm Action',
          "Breakout session don't have Title & Speaker Name Screen",
          'ok',
          () => {},
          this.handleNoSelect
        );
      } else {
        let postData: PostData = {};
        postData.day = this.selectedDay;
        postData.eventName = this.selectedEvent;
        postData.domain = this.selectedDomain;
        postData.sessionId = sessionDetails.SessionId;
        postData.action = 'keynote';
        postData.sessionTitle = this.selectedSessionTitle;
        postData.keyNoteData = sessionDetails;
        postData.primarySessionId = sessionDetails.PrimarySessionId;
        this.backendApiService.postData(postData).subscribe(
          () => {
            this.showSuccessMessage('Show speakers details sent successfully!');
          },
          (error: any) => {
            this.showFailureMessage('Failed to send show speakers details.', error);
          }
        );
      }
    } else {
      this.modalService.open(
        'Confirm Action',
        'Event day and Session should be selected to show speaker details!',
        'ok',
        () => {},
        this.handleNoSelect
      );
    }
  }

  showEndEvent() {
    let postData: PostData = {};
    postData.action = 'thank_you';
    postData.day = 'endEvent';
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('End event message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send end event message.', error);
      }
    );
  }

  startListeningPopUp(): void {
    const session = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    console.log('sessionId for start session', session);
    if (session) {
      this.modalService.open(
        'Start Session?',
        'Are you sure to start session :' + session.SessionTitle + ' ?',
        'yes_no',
        this.startListening.bind(this),
        this.handleNoSelect
      );
    } else {
      this.modalService.open(
        'Confirm Action',
        'Please select the Event , Day , Domain and Speaker Name to start the session',
        'ok',
        () => {},
        this.handleNoSelect
      );
    }
  }

  startListening(): void {
    this.modalService.close();
    if (
      this.selectedDay !== '' &&
      this.selectedSessionTitle !== '' &&
      this.selectedDomain !== '' &&
      this.selectedEvent !== ''
    ) {
      localStorage.setItem('currentSessionTitle', this.selectedSessionTitle);
      const session = this.findSession(this.selectedEvent, this.selectedSessionTitle);
      localStorage.setItem('currentSessionId', session.SessionId);
      localStorage.setItem('currentPrimarySessionId', session.PrimarySessionId);
      localStorage.setItem('currentDay', this.selectedDay);
      localStorage.setItem('selectedEvent', this.selectedEvent);
      localStorage.setItem('domain', this.selectedDomain);
      localStorage.setItem('isSessionInProgress', '1');
      this.isSessionInProgress = true;
      this.startRecording();
      this.backendApiService
        .postCurrentSessionId(session.SessionId, this.selectedEvent, this.selectedDomain, session.PrimarySessionId)
        .subscribe(
          (data: any) => {
            console.log(data);
            this.startListeningClicked = true;
            this.showSuccessMessage('Start session message sent successfully!');
          },
          (error: any) => {
            this.showFailureMessage('Failed to send start session message.', error);
          }
        );
      if (session.Type == 'BreakoutSession') {
        this.showBreakdownInProgress();
      } else {
        this.showLoadingInsights();
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
  }

  handleNoSelect = () => {
    this.modalService.close();
  };

  showLoadingInsights() {
    let postData: PostData = {};
    if (this.selectedDay != '' && this.selectedSessionTitle != '') {
      const sessionDetails = this.findSession(this.selectedEvent, this.selectedSessionTitle);
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
        postData.action = 'insightsLoading';
        postData.sessionTitle = this.selectedSessionTitle;
        this.backendApiService.postData(postData).subscribe(() => {});
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

  showBreakdownInProgress() {
    let postData: PostData = {};
    const sessionDetails = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    const primarySessionTitle=this.findSessionById(sessionDetails.Event,sessionDetails.PrimarySessionId);
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.action = 'breakOutSession';
    postData.sessionTitle = primarySessionTitle;
    this.backendApiService.postData(postData).subscribe(() => {});
  }

  showPostInsightsLoading() {
    let postData: PostData = {};
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.action = 'postInsightsLoading';
    postData.sessionTitle = this.selectedSessionTitle;
    this.backendApiService.postData(postData).subscribe(() => {});
  }

  stopListening(): void {
    const session = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    console.log('sessionId for stop session', session);
    this.modalService.open(
      'Pause Session?',
      'Are you sure to pause the session?',
      'yes_no',
      this.closeSocket,
      this.handleNoSelect
    );
  }

  endEvent(): void {
    let postData: PostData = {};
    postData.action = 'thank_you';
    postData.day = 'endEvent';
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('End event message sent successfully!');
        console.log(data);
      },
      (error: any) => {
        this.showFailureMessage('Failed to send end event message.', error);
      }
    );
  }

  endSessionPopUp = () => {
    this.modalService.open(
      'End Session?',
      'Are you sure that you want to end current session? This will display post session insights on screen.',
      'yes_no',
      this.endSession,
      this.handleNoSelect
    );
  };

  endSessionPopUpPostInsights = () => {
    const session = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    if (session.Type == 'BreakoutSession') {
      this.modalService.open(
        'End Session?',
        'Are you sure that you want to end current breakout session?',
        'yes_no',
        this.endSession,
        this.handleNoSelect
      );
    } else {
      this.modalService.open(
        'End Session?',
        'Are you sure that you want to end current session? This will display post session insights on screen.',
        'yes_no',
        this.endSession,
        this.handleNoSelect
      );
    }
  };

  endSession = (): void => {
    this.modalService.close();
    this.startListeningClicked = false;
    const session = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    console.log('sessionId for end session', session);
    let postData: PostData = {};
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.sessionId = session.SessionId;
    postData.primarySessionId = session.PrimarySessionId;
    postData.sessionTitle = this.selectedSessionTitle;
    this.isSessionInProgress = false;
    if (session.Type == 'BreakoutSession') {
      postData.action = 'endBreakoutSession';
      this.backendApiService.postData(postData).subscribe(
        (data: any) => {
          this.showSuccessMessage('End breakout session message sent successfully!');
        },
        (error: any) => {
          this.showFailureMessage('Failed to send end breakout session message.', error);
        }
      );
      this.closeSocket();
      this.clearSessionData();
    } else {
      postData.action = 'endPrimarySession';
      this.backendApiService.postData(postData).subscribe(
        (data: any) => {
          this.showSuccessMessage('End session message sent successfully!');
          this.showPostInsightsLoading();
        },
        (error: any) => {
          this.showFailureMessage('Failed to send end session message.', error);
        }
      );
      this.closeSocket();
      this.clearSessionData();
    }
  };

  showSummary(): void {
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
      this.selectedOptions.forEach(element => {
        const session = this.findSession(this.selectedEvent, element);
        this.sessionIds.push(session.SessionId);
      });
      let postData: PostData = {};
      postData.action = 'summary_of_Single_Keynote';
      postData.day = this.selectedMultiSessionDay;
      postData.eventName = this.selectedEvent;
      postData.domain = this.selectedDomain;
      postData.sessionId = this.sessionIds;

      this.backendApiService.postData(postData).subscribe(
        (data: any) => {
          console.log(data);
          this.showSuccessMessage('Single keynote message sent successfully!');
        },
        (error: any) => {
          this.showFailureMessage('Failed to send single keynote message.', error);
        }
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
    this.sendTranscriptToBackend(this.lastFiveWords + ' ' + this.transctiptToInsides);
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
    let postData: PostData = {};
    postData.day = this.selectedDay;
    postData.eventName = this.selectedEvent;
    postData.domain = this.selectedDomain;
    postData.primarySessionId = this.currentPrimarySessionId;
    postData.sessionId = this.currentSessionId;
    postData.action = 'realTimeInsights';
    postData.sessionTitle = this.selectedSessionTitle;
    postData.transcript = transcript;
    this.backendApiService.postData(postData).subscribe(() => {
      // Handle success or error if needed
    });
  }

  onPostInsideIntervalChange() {
    // This function will be triggered whenever the value of postInsideInterval changes
    console.log('postInsideInterval changed to:', this.postInsideInterval);
    localStorage.setItem('postInsideInterval', this.postInsideInterval.toString());

    // You can call any other functions or perform any other actions here
  }

  onTranscriptTimeOutChange() {
    // This function will be triggered whenever the value of transcriptTimeOut changes
    console.log('transcriptTimeOut changed to:', this.transcriptTimeOut);
    localStorage.setItem('transcriptTimeOut', this.transcriptTimeOut.toString());
    // You can call any other functions or perform any other actions here
  }
  //***************************************
  startRecording() {
    this.isStreaming = !this.isStreaming;
    console.log('recording');
    window.navigator.mediaDevices
      .getUserMedia({
        video: false,
        audio: true,
      })

      // ...then we convert the mic stream to binary event stream messages when the promise resolves
      .then(this.streamAudioToWebSocket)
      .catch(function (error) {
        console.log('There was an error streaming your audio to Amazon Transcribe. Please try again.', error);
      });
  }
  streamAudioToWebSocket = userMediaStream => {
    //let's get the mic input from the browser, via the microphone-stream module
    this.startListeningClicked = true;
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
      this.micStream.on('data', rawAudioChunk => {
        // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
        let binary = this.convertAudioToBinaryMessage(rawAudioChunk);

        if (this.isSessionInProgress && this.socket.OPEN) this.socket.send(binary);
      });
    };
    console.log('start streamAudioToWebSocket5555');
    // handle messages, errors, and close events
    this.wireSocketEvents();
  }
  createPresignedUrlNew = async () => {
    let body = {
      method: 'GET',
      endpoint: 'transcribestreaming.' + this.region + '.amazonaws.com:8443',
      path: '/stream-transcription-websocket',
      service: 'transcribe',
      hash: createHash('sha256').update('', 'utf8').digest('hex'),
      options: {
        protocol: 'wss',
        expires: 15,
        region: 'ca-central-1',
        query: 'language-code=' + this.languageCode + '&media-encoding=pcm&sample-rate=' + this.sampleRate,
      },
    };
    await this.backendApiService.getTranscriberPreSignedUrl(body).subscribe((data: any) => {
      console.log('inside  createPresignedUrlNew', JSON.stringify(data));
      const url = data.data;
      this.openWebsocketAndStartStream(url);
    });
  };
  getAudioEventMessage = buffer => {
    // wrap the audio data in a JSON envelope
    return {
      headers: {
        ':message-type': {
          type: 'string',
          value: 'event',
        },
        ':event-type': {
          type: 'string',
          value: 'AudioEvent',
        },
      },
      body: buffer,
    };
  };
  convertAudioToBinaryMessage = audioChunk => {
    let raw = MicrophoneStream.toRaw(audioChunk);

    if (raw == null) return;

    // downsample and convert the raw audio bytes to PCM
    let downsampledBuffer = downsampleBuffer(raw, this.sampleRate);
    let pcmEncodedBuffer = pcmEncode(downsampledBuffer);

    // add the right JSON headers and structure to the message
    let audioEventMessage = this.getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

    //convert the JSON object + headers into a binary event stream message
    // @ts-ignore
    let binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
  };

  closeSocket = () => {
    this.modalService.close();
    localStorage.setItem('isSessionInProgress', '0');
    this.isSessionInProgress = false;
    if (this.socket.OPEN) {
      this.micStream.stop();

      // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
      let emptyMessage = this.getAudioEventMessage(Buffer.from(new Buffer([])));
      // @ts-ignore
      let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
      this.socket.send(emptyBuffer);
    }
    clearInterval(this.timeoutId);
    this.startListeningClicked = false;
    this.isStreaming = !this.isStreaming;
  };

  clearSessionData = () => {
    clearInterval(this.timeoutId);
    this.startListeningClicked = false;
    localStorage.setItem('isSessionInProgress', '0');
    this.isSessionInProgress = false;
    localStorage.removeItem('currentSessionTitle');
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('currentPrimarySessionId');
    localStorage.removeItem('selectedEvent');
    localStorage.removeItem('lastFiveWords');
    this.transctiptToInsides = '';
    this.isStreaming = false;
  };

  handleEventStreamMessage = messageJson => {
    let results = messageJson.Transcript.Results;
    console.log('messageJSON got from the transcribe', JSON.stringify(messageJson));
    if (results.length > 0) {
      if (results[0].Alternatives.length > 0) {
        let transcript = results[0].Alternatives[0].Transcript;

        // fix encoding for accented characters
        transcript = decodeURIComponent(escape(transcript));

        // update the textarea with the latest result
        console.log('transcript-->', transcript);

        // if this transcript segment is final, add it to the overall transcription
        if (!results[0].IsPartial) {
          //scroll the textarea down
          this.transcription = transcript;
          // this.transcription += transcript + '\n';
          console.log('sid here ', this.currentSessionId);
          if (this.currentSessionId && this.currentPrimarySessionId == this.currentSessionId) {
            this.realtimeInsides(this.transcription);
          }
          if (this.currentSessionId && this.isSessionInProgress) {
            this.backendApiService.putTranscript(this.transcription).subscribe(
              (data: any) => {
                console.log(data);
              },
              (error: any) => {
                this.showFailureMessage('Failed to store transcript', error);
              }
            );
          }
        }
      }
    }
  };
  wireSocketEvents = () => {
    // handle inbound messages from Amazon Transcribe
    this.socket.onmessage = message => {
      //convert the binary event stream message to JSON
      let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
      let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
      if (this.isSessionInProgress && messageWrapper.headers[':message-type'].value === 'event') {
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

    this.socket.onclose = closeEvent => {
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
}

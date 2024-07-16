import { Component, OnInit } from '@angular/core';
import { BackendApiService } from 'src/app/services/backend-api.service';
declare const Buffer;
import { pcmEncode, downsampleBuffer } from '../../helpers/audioUtils';
import * as createHash from 'create-hash';
import * as marshaller from '@aws-sdk/eventstream-marshaller'; // for converting binary event stream messages to and from JSON
import * as util_utf8_node from '@aws-sdk/util-utf8-node'; // utilities for encoding and decoding UTF8
import MicrophoneStream from 'microphone-stream'; // collect microphone input as a stream of raw bytes

const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);

interface PostData {
  action?: string;
  sessionId?: any;
  eventName?: string;
  domain?: string;
  day?: string;
  keyNoteData?: any;
  transcript?: string;
  screenTimeout?: number;
  sessionTitle?: string;
  theme?: string;
}
@Component({
  selector: 'app-session-content',
  templateUrl: './session-content.component.html',
  styleUrls: ['./session-content.component.css']
})
export class SessionContentComponent implements OnInit {

  selectedEvent: string = '';
  selectedKeynoteType: string = '';
  selectedSessionType: string = '';
  selectedReportType: string = '';
  selectedDay: string = '';
  eventDetails: any = [];
  eventDays: any = [];
  eventNames: any = [];
  selectedSessionTitle: string = '';
  sessionTitles: string[] = [];
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
  postInsideInterval: number = 15;
  transcriptTimeOut: number = 60;
  lastFiveWords: string = '';

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

  event_cards = [
    { title: 'Welcome Screen', imageUrl: '../../../assets/admin screen/welcomw_screen.svg', displayFunction: () => this.showWelcomeMessageBanner() },
    { title: 'Thank You Screen', imageUrl: '../../../assets/admin screen/thank_you_page.svg', displayFunction: () => this. showThankYouScreen() },
    { title: 'Info Screen', imageUrl: '../../../assets/admin screen/qr_screen.svg', displayFunction: () => this.showInfoScreen() },
  ];
  session_cards = [
    { title: 'Title & Speaker Name Screen', imageUrl: '../../../assets/admin screen/moderator_screen.svg',displayFunction: () => this.showKeyNote()  },
    { title: 'Backup Screen', imageUrl: '../../../assets/admin screen/welcomw_screen.svg' },
    { title: 'Post Session Insights Screens', imageUrl: '../../../assets/admin screen/summary_screen.svg',icon:'../../../assets/admin screen/note.svg' },
  ];
  multi_session_card=[
    { title: 'Post Session Insights Screens', imageUrl: '../../../assets/admin screen/summary_screen.svg' ,icon:'../../../assets/admin screen/note.svg'  },
 
  ]
  constructor(private backendApiService: BackendApiService) { }

  ngOnInit() {
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
    let postData:PostData={};
    postData.action='welcome';
    postData.day=this.selectedDay;
    this.backendApiService.postData(postData).subscribe(
      (data: any) => {
        this.showSuccessMessage('Welcome message screen sent successfully!');
      },
      (error: any) => {
        this.showFailureMessage('Failed to send welcome message.', error);
      }
    );
  }

  showThankYouScreen(): void {
    let postData:PostData={};
    postData.action='thank_you';
    postData.day=this.selectedDay;
    postData.eventName=this.selectedEvent;
    postData.domain=this.selectedDomain;
    this.backendApiService.postData(postData).subscribe((data: any) => {
      this.showSuccessMessage('Thank you message sent successfully!');
      console.log(data);
    },
      (error: any) => {
        this.showFailureMessage('Failed to send thank you message.', error);
      });
  }

//it is qr screen
  showInfoScreen(): void {
    let postData:PostData={};
    postData.action='qr_screen';
    postData.day=this.selectedDay;
    postData.eventName=this.selectedEvent;
    postData.domain=this.selectedDomain;
    this.backendApiService.postData(postData).subscribe((data: any) => {
      console.log(data);
      this.showSuccessMessage('Qr message sent successfully!');
    },
      (error: any) => {
        this.showFailureMessage('Failed to send qr message.', error);
      });
  }
  findSession(event: string, SessionTitle: string) {
    const session = this.eventDetails.find((session: { Event: string; SessionTitle: string; }) =>
      session.Event === event && session.SessionTitle === SessionTitle
    );
    return session ? session : null;
  }


  showKeyNote() {
    if (this.selectedDay != '' && this.selectedSessionTitle != '') {
      const sessionDetails = this.findSession(this.selectedEvent, this.selectedSessionTitle);
      let postData:PostData={};
      postData.day=this.selectedDay;
      postData.eventName=this.selectedEvent;
      postData.domain=this.selectedDomain;
      postData.sessionId=sessionDetails.SessionId;
      postData.action='keynote';
      postData.sessionTitle=this.selectedSessionTitle;
      postData.keyNoteData=sessionDetails;
      this.backendApiService.postData(postData).subscribe(() => {
        this.showSuccessMessage('Show speakers details sent successfully!');
      },
        (error: any) => {
          this.showFailureMessage('Failed to send show speakers details.', error);
        });
    } else {
      alert('Event day and Session should be selected to show speaker details!');
    }
  }

  showEndEvent() {
    let postData:PostData={};
    postData.action='thank_you';
    postData.day='endEvent';
    postData.eventName=this.selectedEvent;
    postData.domain=this.selectedDomain;
    this.backendApiService.postData(postData).subscribe((data: any) => {
      this.showSuccessMessage('End event message sent successfully!');
      console.log(data);
    },
      (error: any) => {
        this.showFailureMessage('Failed to send end event message.', error);
      });
  }

  startListening(): void {
    // Implement start listening functionality
    console.log('Start listening');
  }
  showPostInsightsLoading() {
    let postData:PostData={};
    postData.day=this.selectedDay;
    postData.eventName=this.selectedEvent;
    postData.domain=this.selectedDomain;
    postData.action='postInsightsLoading';
    postData.sessionTitle=this.selectedSessionTitle;
    this.backendApiService.postData(postData).subscribe(() => {
    });
  }
  getAudioEventMessage = (buffer) => {
    // wrap the audio data in a JSON envelope
    return {
      'headers': {
        ':message-type': {
          type: 'string',
          value: 'event'
        },
        ':event-type': {
          type: 'string',
          value: 'AudioEvent'
        }
      },
      body: buffer
    };
  }
  closeSocket = () => {
    if (this.socket.OPEN) {
      this.micStream.stop();

      // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
      let emptyMessage = this.getAudioEventMessage(Buffer.from(new Buffer([])));
      // @ts-ignore
      let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
      this.socket.send(emptyBuffer);
    }
    clearInterval(this.timeoutId);
    localStorage.removeItem('currentSessionTitle')
    localStorage.removeItem('currentSessionId')
    localStorage.removeItem('selectedEvent')
    localStorage.removeItem('lastFiveWords')
    this.selectedSessionTitle = ''
    this.transctiptToInsides = '';
    this.isStreaming = !this.isStreaming
  }
  stopScreen(): void {
    const session = this.findSession(this.selectedEvent, this.selectedSessionTitle);
    console.log("sessionId for end session", session)
    if (confirm("Are you sure to end the session?")) {
      let postData:PostData={};
      postData.day=this.selectedDay;
      postData.eventName=this.selectedEvent;
      postData.domain=this.selectedDomain;
      postData.sessionId=session.SessionId;
      postData.action='end_session';
      postData.sessionTitle=this.selectedSessionTitle;
      this.backendApiService.postData(postData).subscribe((data: any) => {
        this.showSuccessMessage('End session message sent successfully!');
        this.showPostInsightsLoading()
      },
        (error: any) => {
          this.showFailureMessage('Failed to send end session message.', error);
        });
      this.closeSocket();
    }
  }

  endSession(): void {
    let postData:PostData={};
    postData.action='thank_you';
    postData.day='endEvent';
    postData.eventName=this.selectedEvent;
    postData.domain=this.selectedDomain;
    this.backendApiService.postData(postData).subscribe((data: any) => {
      this.showSuccessMessage('End event message sent successfully!');
      console.log(data);
    },
      (error: any) => {
        this.showFailureMessage('Failed to send end event message.', error);
      });
  }
  
}

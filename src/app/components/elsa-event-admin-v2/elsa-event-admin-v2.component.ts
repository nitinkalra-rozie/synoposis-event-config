import { Component, OnInit } from '@angular/core';
import { BackendApiService } from 'src/app/services/backend-api.service';
import { INITIAL_POST_DATA, TimeWindows, TransitionTimes } from 'src/app/shared/constants';
import { PostDataEnum, ThemeOptions, TimeWindowsEnum } from 'src/app/shared/enums';
import { EventDetail, PostData } from 'src/app/shared/types';

@Component({
  selector: 'app-elsa-event-admin-v2',
  templateUrl: './elsa-event-admin-v2.component.html',
  styleUrls: ['./elsa-event-admin-v2.component.css'],
})
export class ElsaEventAdminV2Component implements OnInit {
  eventNames: Array<string> = [];
  eventDetails: Array<EventDetail> = [];
  themeOptions: ThemeOptions[] = [ThemeOptions.dark, ThemeOptions.light];
  successMessage: string = '';
  failureMessage: string = '';
  postData: PostData = {};
  eventDays: any = [];
  sessionTitles: string[] = [];
  options: string[] = [];
  // session: any
  selectedSessionTitle: string;
  transcriptTimeOut: { label: string; value: number } = {
    label: TimeWindowsEnum['60 Seconds'],
    value: TimeWindows['60 Seconds'],
  };

  constructor(private backendApiService: BackendApiService) {}

  ngOnInit() {
    this.initializeData();
  }

  initializeData = () => {
    this.postData = { ...INITIAL_POST_DATA };
    this.getEventDetails();
  };

  getEventDetails = () => {
    this.backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data;
      this.populateEventNames();
      // this.selectDefaultOptions();
    });
  };

  populateEventNames = () => {
    this.eventNames = Array.from(new Set(this.eventDetails.map(event => event.Event)));
    this.updatePostData({ key: PostDataEnum.eventName, value: this.eventNames[0] });
  };

  populateSessionTitles() {
    const filteredByDay = this.eventDetails.filter(
      event => event.Event === this.postData.eventName && event.EventDay === this.postData.day
    );
    this.sessionTitles = filteredByDay.map(event => event.SessionTitle);
    this.options = this.sessionTitles;
  }

  populateEventDays() {
    const filteredByEvent = this.eventDetails.filter(event => event.Event === this.postData.eventName);
    this.eventDays = Array.from(new Set(filteredByEvent.map(event => event.EventDay)));
  }

  onEventChange = () => {
    this.populateEventDays();
    this.updatePostData({ key: PostDataEnum.day, value: this.eventDays.length > 0 ? this.eventDays[0] : '' });
    this.onDayChange();
  };

  findSession(event: string, SessionTitle: string) {
    const session = this.eventDetails.find(
      (session: { Event: string; SessionTitle: string }) =>
        session.Event === event && session.SessionTitle === SessionTitle
    );
    return session ? session : null;
  }

  onDayChange = () => {
    this.populateSessionTitles();
    this.selectedSessionTitle = this.sessionTitles.length > 0 ? this.sessionTitles[0] : '';
    const sessionDetails = this.findSession(this.postData.eventName, this.selectedSessionTitle);
    this.updatePostData({ key: PostDataEnum.sessionId, value: sessionDetails.SessionId });
  };

  // private showSuccessMessage(message: string): void {
  //   this.successMessage = message;
  //   setTimeout(() => {
  //     this.successMessage = '';
  //   }, 3000);
  // }

  // private showFailureMessage(message: string, error: any): void {
  //   this.failureMessage = message;
  //   setTimeout(() => {
  //     this.failureMessage = '';
  //   }, 5000);
  // }

  callBackEndAPI = () => {
    this.backendApiService.postData(this.postData).subscribe(
      (data: any) => {
        console.log(data);
      },
      (error: any) => {
        console.log(error);
      }
    );
  };

  onTranscriptTimeOutChange = () => {
    // This function will be triggered whenever the value of transcriptTimeOut changes
    console.log('transcriptTimeOut changed to:', this.transcriptTimeOut);
    localStorage.setItem('transcriptTimeOut', this.transcriptTimeOut.toString());
    // You can call any other functions or perform any other actions here
  };

  updatePostData = ({ key, value }: { key: PostDataEnum; value: string }) => {
    const tempKey = key as string;
    if (key === PostDataEnum.screenTimeout) {
      this.postData[tempKey] = TimeWindows[value];
    } else {
      this.postData[tempKey] = value;
    }
    switch (key) {
      case PostDataEnum.theme:
        this.postData.action = 'updateTheme';
        break;

      case PostDataEnum.eventName:
        this.onEventChange();
        break;

      case PostDataEnum.screenTimeout:
        this.transcriptTimeOut = {
          label: TimeWindowsEnum[value],
          value: TimeWindows[value],
        };
        this.onTranscriptTimeOutChange();
        break;

      default:
        break;
    }
    console.log('postData', this.postData);

    // this.callBackEndAPI();
  };

  handleReset = () => {
    this.initializeData();
    this.transcriptTimeOut = {
      label: TimeWindowsEnum['60 Seconds'],
      value: TimeWindows['60 Seconds'],
    };
    console.log('000', this.postData);
  };
}

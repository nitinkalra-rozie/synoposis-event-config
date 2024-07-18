import { Component, OnInit } from '@angular/core';
import { BackendApiService } from 'src/app/services/backend-api.service';
import { INITIAL_POST_DATA, TimeWindows, TransitionTimes } from 'src/app/shared/constants';
import { EventDetailType, PostDataEnum, ThemeOptions, TimeWindowsEnum } from 'src/app/shared/enums';
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
  eventDays: string[] = [];
  sessionTitles: string[] = [];
  primarySessionTitles: string[];
  options: string[] = [];
  selectedSessionTitle: string;
  transcriptTimeOut: { label: string; value: number } = {
    label: TimeWindowsEnum['60 Seconds'],
    value: TimeWindows['60 Seconds'],
  };

  constructor(private backendApiService: BackendApiService) {}

  ngOnInit() {
    this.initializeData();
  }

  getKeyByValue = (value, object) => {
    return Object.keys(object).find(key => object[key] === value);
  };

  initializeData = () => {
    this.postData = { ...INITIAL_POST_DATA };
    this.transcriptTimeOut = this.transcriptTimeOut = {
      label: this.getKeyByValue(parseInt(localStorage.getItem('transcriptTimeOut')) || 60, TimeWindows),
      value: parseInt(localStorage.getItem('transcriptTimeOut')) || 60,
    };
    localStorage.setItem('transcriptTimeOut', this.transcriptTimeOut.value.toString());

    if (!parseInt(localStorage.getItem('postInsideInterval'))) {
      localStorage.setItem('postInsideInterval', this.postData.screenTimeout.toString());
      localStorage.setItem('postInsideValue', this.getKeyByValue(this.postData.screenTimeout, TransitionTimes));
    }

    this.getEventDetails();
  };

  getEventDetails = () => {
    this.backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data;
      this.populateEventNames();
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
    this.primarySessionTitles = filteredByDay
      .filter(event => event.Type === EventDetailType.PrimarySession)
      .map(event => event.SessionTitle);
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
    if (sessionDetails) {
      this.updatePostData({ key: PostDataEnum.sessionId, value: sessionDetails.SessionId });
    }
  };

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
    localStorage.setItem('transcriptTimeOut', this.transcriptTimeOut.value.toString());
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
  };

  handleReset = () => {
    localStorage.removeItem('transcriptTimeOut');
    localStorage.removeItem('postInsideInterval');
    localStorage.removeItem('postInsideValue');
    this.initializeData();
    this.transcriptTimeOut = {
      label: TimeWindowsEnum['60 Seconds'],
      value: TimeWindows['60 Seconds'],
    };
  };
}

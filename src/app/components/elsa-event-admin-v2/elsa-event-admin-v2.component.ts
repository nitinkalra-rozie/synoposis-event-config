import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DropdownOption } from '@syn/models';
import {
  GetDropdownOptionFromObjectPipe,
  GetMultiSelectOptionFromStringPipe,
} from '@syn/pipes';
import { DashboardFiltersStateService } from '@syn/services';
import { SidebarControlPanelComponent } from 'src/app/@components/sidebar-control-panel/sidebar-control-panel.component';
import { BackendApiService } from 'src/app/services/backend-api.service';
import {
  INITIAL_POST_DATA,
  TimeWindows,
  TransitionTimes,
} from 'src/app/shared/constants';
import {
  EventDetailType,
  PostDataEnum,
  ThemeOptions,
  TimeWindowsEnum,
} from 'src/app/shared/enums';
import { EventDetail, PostData } from 'src/app/shared/types';
import { EventControlsComponent } from '../event-controls/event-controls.component';
import { SessionContentComponent } from '../session-content/session-content.component';
import { TopBarComponent } from '../shared/top-bar/top-bar.component';

@Component({
  selector: 'app-elsa-event-admin-v2',
  templateUrl: './elsa-event-admin-v2.component.html',
  styleUrls: ['./elsa-event-admin-v2.component.scss'],
  standalone: true,
  providers: [
    GetMultiSelectOptionFromStringPipe,
    GetDropdownOptionFromObjectPipe,
  ],
  imports: [
    TopBarComponent,
    EventControlsComponent,
    SessionContentComponent,
    GetMultiSelectOptionFromStringPipe,
    GetDropdownOptionFromObjectPipe,
    SidebarControlPanelComponent,
  ],
})
export class ElsaEventAdminV2Component implements OnInit, AfterViewInit {
  //#region DI
  filtersStateService = inject(DashboardFiltersStateService);
  backendApiService = inject(BackendApiService);
  getMultiSelectOptionFromStringPipe = inject(
    GetMultiSelectOptionFromStringPipe
  );
  getDropdownOptionFromObjectPipe = inject(GetDropdownOptionFromObjectPipe);
  //#endregion

  @ViewChild('contentContainer')
  protected contentContainer: ElementRef<HTMLDivElement>;

  eventNames: string[] = [];
  eventDetails: EventDetail[] = [];
  themeOptions: ThemeOptions[] = [ThemeOptions.Dark, ThemeOptions.Light];
  successMessage = '';
  failureMessage = '';
  postData: PostData = {};
  eventDays: string[] = [];
  sessionTitles: string[] = [];
  primarySessionTitles: string[];
  options: string[] = [];
  selectedSessionTitle: string;
  transcriptTimeOut: { label: string; value: number } = {
    label: TimeWindowsEnum.Seconds60,
    value: TimeWindows['60 Seconds'],
  };

  ngOnInit() {
    this.initializeData();
  }

  ngAfterViewInit(): void {
    document.documentElement.style.setProperty(
      '--dashboard-content-container-width',
      `${this.contentContainer.nativeElement.clientWidth}px`
    );
  }

  getKeyByValue = (value, object) =>
    Object.keys(object).find((key) => object[key] === value);

  initializeData = () => {
    this.postData = { ...INITIAL_POST_DATA };
    this.transcriptTimeOut = this.transcriptTimeOut = {
      label: this.getKeyByValue(
        parseInt(localStorage.getItem('transcriptTimeOut')) || 60,
        TimeWindows
      ),
      value: parseInt(localStorage.getItem('transcriptTimeOut')) || 60,
    };
    localStorage.setItem(
      'transcriptTimeOut',
      this.transcriptTimeOut.value.toString()
    );

    if (!parseInt(localStorage.getItem('postInsideInterval'))) {
      localStorage.setItem(
        'postInsideInterval',
        this.postData.screenTimeout.toString()
      );
      localStorage.setItem(
        'postInsideValue',
        this.getKeyByValue(this.postData.screenTimeout, TransitionTimes)
      );
    }

    this.getEventDetails();
  };

  getEventDetails = () => {
    this.backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data.data;
      this.populateEventNames();
      this.filtersStateService.setAllSessions(
        this.getDropdownOptionFromObjectPipe.transform<any>(
          this.eventDetails,
          'SessionTitle',
          'SessionId',
          false,
          'Status',
          'IN_PROGRESS'
        )
      );
    });
  };

  populateEventNames = () => {
    // to be removed later after assessing the usage and impact
    this.eventNames = Array.from(
      new Set(this.eventDetails.map((event) => event.Event))
    );

    // set initial values. all deselected by default
    const eventNamesArray: DropdownOption[] =
      this.getMultiSelectOptionFromStringPipe.transform(this.eventNames);
    this.filtersStateService.setEventNames(eventNamesArray);

    this.filtersStateService.setSelectedEvent(eventNamesArray[0]);

    this.updatePostData({
      key: PostDataEnum.EventName,
      value: this.eventNames[0],
    });
  };

  populateSessionTitles() {
    const filteredByDay = this.eventDetails.filter(
      (event) =>
        event.Event === this.postData.eventName &&
        event.EventDay === this.postData.day
    );
    this.sessionTitles = filteredByDay.map((event) => event.SessionTitle);
    this.primarySessionTitles = filteredByDay
      .filter((event) => event.Type === EventDetailType.PrimarySession)
      .map((event) => event.SessionTitle);
    this.options = this.sessionTitles;
  }

  populateEventDays() {
    const filteredByEvent = this.eventDetails.filter(
      (event) => event.Event === this.postData.eventName
    );

    // to be removed later after assessing the usage and impact
    this.eventDays = Array.from(
      new Set(filteredByEvent.map((event) => event.EventDay))
    );
    // set initial values. all deselected by default
    const eventDaysArray: DropdownOption[] =
      this.getMultiSelectOptionFromStringPipe.transform(this.eventDays, true);
    this.filtersStateService.setEventDays(eventDaysArray);

    this.populateEventTracks(filteredByEvent);
  }

  populateEventTracks(eventDetailsForEvent: EventDetail[]) {
    this.filtersStateService.setEventTracks(
      this.getMultiSelectOptionFromStringPipe.transform(
        Array.from(new Set(eventDetailsForEvent.map((event) => event.Track))),
        true
      )
    );
  }

  onEventChange = () => {
    this.populateEventDays();
    this.updatePostData({
      key: PostDataEnum.Day,
      value: this.eventDays.length > 0 ? this.eventDays[0] : '',
    });
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
    this.selectedSessionTitle =
      this.sessionTitles.length > 0 ? this.sessionTitles[0] : '';
    const sessionDetails = this.findSession(
      this.postData.eventName,
      this.selectedSessionTitle
    );
    if (sessionDetails) {
      this.updatePostData({
        key: PostDataEnum.SessionId,
        value: sessionDetails.SessionId,
      });
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
    localStorage.setItem(
      'transcriptTimeOut',
      this.transcriptTimeOut.value.toString()
    );
    // You can call any other functions or perform any other actions here
  };

  updatePostData = ({ key, value }: { key: PostDataEnum; value: string }) => {
    const tempKey = key as string;
    if (key === PostDataEnum.ScreenTimeout) {
      this.postData[tempKey] = TimeWindows[value];
    } else {
      this.postData[tempKey] = value;
    }
    switch (key) {
      case PostDataEnum.Theme:
        this.postData.action = 'updateTheme';
        break;

      case PostDataEnum.EventName:
        this.onEventChange();
        break;

      case PostDataEnum.ScreenTimeout:
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
      label: TimeWindowsEnum.Seconds60,
      value: TimeWindows['60 Seconds'],
    };
  };
}

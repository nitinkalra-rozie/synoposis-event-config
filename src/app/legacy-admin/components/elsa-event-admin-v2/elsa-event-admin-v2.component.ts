import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { SidebarControlPanelComponent } from 'src/app/legacy-admin/@components/sidebar-control-panel/sidebar-control-panel.component';
import { GetDropdownOptionFromObjectPipe } from 'src/app/legacy-admin/@pipes/get-dropdown-option-from-object.pipe';
import { GetMultiSelectOptionFromStringPipe } from 'src/app/legacy-admin/@pipes/get-multi-select-option-from-string.pipe';

import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { EventControlsComponent } from 'src/app/legacy-admin/components/event-controls/event-controls.component';
import { SessionContentComponent } from 'src/app/legacy-admin/components/session-content/session-content.component';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import {
  INITIAL_POST_DATA,
  TimeWindows,
  TransitionTimes,
} from 'src/app/legacy-admin/shared/constants';
import {
  EventDetailType,
  PostDataEnum,
  ThemeOptions,
  TimeWindowsEnum,
} from 'src/app/legacy-admin/shared/enums';
import { EventDetail, PostData } from 'src/app/legacy-admin/shared/types';

@Component({
  selector: 'app-elsa-event-admin-v2',
  templateUrl: './elsa-event-admin-v2.component.html',
  styleUrls: ['./elsa-event-admin-v2.component.scss'],
  providers: [
    GetMultiSelectOptionFromStringPipe,
    GetDropdownOptionFromObjectPipe,
  ],
  imports: [
    EventControlsComponent,
    SessionContentComponent,
    SidebarControlPanelComponent,
  ],
})
export class ElsaEventAdminV2Component implements OnInit, AfterViewInit {
  protected contentContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('contentContainer');

  protected _sessionContentComponent = viewChild(SessionContentComponent);

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
  isAutoAvEnabled = signal<boolean>(false);

  //#region DI
  private _filtersStateService = inject(DashboardFiltersStateService);
  private _getMultiSelectOptionFromStringPipe = inject(
    GetMultiSelectOptionFromStringPipe
  );
  private _getDropdownOptionFromObjectPipe = inject(
    GetDropdownOptionFromObjectPipe
  );
  private _backendApiService = inject(LegacyBackendApiService);
  //#endregion

  private _shouldFetchEventDetails = computed(() =>
    this._filtersStateService.shouldFetchEventDetails()
  );
  private _eventDays = computed(() => this._filtersStateService.eventDays());
  private _eventTracks = computed(() =>
    this._filtersStateService.eventTracks()
  );
  private _eventLocations = computed(() =>
    this._filtersStateService.eventLocations()
  );

  constructor() {
    effect(() => {
      if (this._shouldFetchEventDetails()) {
        this.getEventDetails();
        this._filtersStateService.setShouldFetchEventDetails(false);
      }
    });
  }

  ngOnInit() {
    this.initializeData();

    const autoAvState = localStorage.getItem('IS_AUTO_AV_ENABLED');
    this.isAutoAvEnabled.set(autoAvState ? JSON.parse(autoAvState) : false);
  }

  onAutoAvChanged(state: boolean): void {
    this.isAutoAvEnabled.set(state);
    console.log(
      'AutoAV Enabled State in ElsaEventAdminV2Component:',
      this.isAutoAvEnabled()
    );
  }

  ngAfterViewInit(): void {
    document.documentElement.style.setProperty(
      '--dashboard-content-container-width',
      `${this.contentContainer().nativeElement.clientWidth}px`
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
    this._backendApiService.getEventDetails().subscribe((data: any) => {
      this.eventDetails = data.data;
      this.populateEventNames();
      this.setSelectedLocationFromStorage();
      this._filtersStateService.setAllSessions(
        this._getDropdownOptionFromObjectPipe.transform<any>(
          this.eventDetails,
          'SessionTitle',
          'SessionId',
          false,
          'Status',
          'IN_PROGRESS'
        )
      );

      // Update postData with eventName and eventDomain from API
      this.updatePostData({
        key: PostDataEnum.EventName,
        value: this._backendApiService.getCurrentEventName(),
      });
      this.updatePostData({
        key: PostDataEnum.Domain,
        value: this._backendApiService.getCurrentEventDomain(),
      });
    });
  };

  populateEventNames = () => {
    // to be removed later after assessing the usage and impact
    this.eventNames = Array.from(
      new Set(this.eventDetails.map((event) => event.Event))
    );

    // set initial values. all deselected by default
    const eventNamesArray: DropdownOption[] =
      this._getMultiSelectOptionFromStringPipe.transform(this.eventNames);
    this._filtersStateService.setEventNames(eventNamesArray);

    this._filtersStateService.setSelectedEvent(eventNamesArray[0]);

    this.updatePostData({
      key: PostDataEnum.EventName,
      value: this.eventNames[0],
    });
  };

  setSelectedLocationFromStorage() {
    const selectedLocation: DropdownOption = JSON.parse(
      localStorage.getItem('SELECTED_LOCATION')
    );
    if (selectedLocation) {
      this._filtersStateService.setSelectedLocation(selectedLocation);
    }
  }

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
      this._getMultiSelectOptionFromStringPipe.transform(
        this.eventDays,
        true,
        this._eventDays()
      );
    this._filtersStateService.setEventDays(eventDaysArray);

    this.populateEventLocations(filteredByEvent);
    this.populateEventTracks(filteredByEvent);
  }

  populateEventLocations(eventDetailsForEvent: EventDetail[]) {
    this._filtersStateService.setEventLocations(
      this._getMultiSelectOptionFromStringPipe.transform(
        Array.from(
          new Set(eventDetailsForEvent.map((event) => event.Location))
        ),
        true,
        this._eventLocations()
      )
    );
  }

  populateEventTracks(eventDetailsForEvent: EventDetail[]) {
    this._filtersStateService.setEventTracks(
      this._getMultiSelectOptionFromStringPipe.transform(
        Array.from(new Set(eventDetailsForEvent.map((event) => event.Track))),
        true,
        this._eventTracks()
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

  // TODO: @later remove this approach as this is written to cater the legacy code pattern
  getSessionContentComponent(): SessionContentComponent | undefined {
    return this._sessionContentComponent();
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

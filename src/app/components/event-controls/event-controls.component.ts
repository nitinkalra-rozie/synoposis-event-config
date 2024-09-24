import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  SynMultiSelectComponent,
  SynSingleSelectComponent,
} from '@syn/components';
import { DropdownOption, RightSidebarState } from '@syn/models';
import { GetMultiSelectOptionFromStringPipe } from '@syn/pipes';
import {
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';
import {
  INITIAL_POST_DATA,
  TimeWindows,
  TransitionTimes,
} from 'src/app/shared/constants';
import {
  PostDataEnum,
  ThemeOptions,
  TimeWindowsEnum,
  TransitionTimesEnum,
} from 'src/app/shared/enums';
import { PostData } from 'src/app/shared/types';
import { MainDropDownComponent } from '../main-drop-down/main-drop-down.component';

@Component({
  selector: 'app-event-controls',
  templateUrl: './event-controls.component.html',
  styleUrls: ['./event-controls.component.scss'],
  providers: [GetMultiSelectOptionFromStringPipe],
  standalone: true,
  imports: [
    MainDropDownComponent,
    SynMultiSelectComponent,
    GetMultiSelectOptionFromStringPipe,
    NgClass,
    SynSingleSelectComponent,
  ],
})
export class EventControlsComponent implements OnInit {
  //#region DI
  private _filtersStateService = inject(DashboardFiltersStateService);
  private _globalStateService = inject(GlobalStateService);
  //#endregion

  public PostDataEnum = PostDataEnum;
  timeWindows;
  transitionTimes;
  postInsideInterval: number = TransitionTimes['15 Seconds'];
  postInsideValue: string = TransitionTimesEnum.Seconds15;

  // @Input() eventNames: string[] = [];
  @Input() transcriptTimeOut: { label: string; value: number } = {
    label: TimeWindowsEnum.Seconds60,
    value: TimeWindows['60 Seconds'],
  };
  @Input() postData: PostData = INITIAL_POST_DATA;
  @Input() themeOptions: ThemeOptions[];

  eventTracks = computed(() => this._filtersStateService.eventTracks());
  eventDays = computed(() => this._filtersStateService.eventDays());
  eventNames = computed(() => this._filtersStateService.eventNames());
  selectedEvent = computed(() => this._filtersStateService.selectedEvent());

  protected rightSidebarState = computed(() =>
    this._globalStateService.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;

  @Output() onUpdatePostData: EventEmitter<{
    key: PostDataEnum;
    value: string;
  }>;
  @Output() onReset: EventEmitter<void>;

  constructor() {
    this.onUpdatePostData = new EventEmitter();
    this.onReset = new EventEmitter();
  }

  ngOnInit() {
    this.timeWindows = Object.keys(TimeWindows);
    this.transitionTimes = Object.keys(TransitionTimes);
    this.postInsideInterval =
      parseInt(localStorage.getItem('postInsideInterval')) || 15;
    this.postInsideValue =
      localStorage.getItem('postInsideValue') || TransitionTimesEnum.Seconds15;
  }

  onPostInsideIntervalChange = (value: string) => {
    // This function will be triggered whenever the value of postInsideInterval changes
    this.postInsideInterval = TransitionTimes[value];
    this.postInsideValue = TransitionTimesEnum[value];
    console.log('postInsideInterval changed to:', this.postInsideInterval);
    localStorage.setItem(
      'postInsideInterval',
      this.postInsideInterval.toString()
    );
    localStorage.setItem('postInsideValue', this.postInsideValue.toString());
    // You can call any other functions or perform any other actions here
  };

  handleDropdownSelect = (value: string, key: PostDataEnum | string) => {
    if ((key as string) === 'TransitionTimes') {
      this.onPostInsideIntervalChange(value);
    } else {
      this.onUpdatePostData.emit({ key: key as PostDataEnum, value });
    }
  };

  handleResetClick = () => {
    this.postInsideInterval = TransitionTimes['15 Seconds'];
    this.postInsideValue = TransitionTimesEnum.Seconds15;
    this.onReset.emit();
  };

  onEventTracksSelect = (selectedOptions: DropdownOption[]) => {
    const tracksCopy = [...this.eventTracks()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedTracksSet = new Set(selectedLabels);
    tracksCopy.forEach((aOption) => {
      if (selectedTracksSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
    this._filtersStateService.setEventTracks(tracksCopy);
  };

  onEventDaysSelect = (selectedOptions: DropdownOption[]) => {
    const daysCopy = [...this.eventDays()];
    const selectedLabels: string[] = [];
    for (const aOption of selectedOptions) {
      if (aOption.isSelected) {
        selectedLabels.push(aOption.label);
      }
    }
    const selectedDaysSet = new Set(selectedLabels);
    daysCopy.forEach((aOption) => {
      if (selectedDaysSet.has(aOption.label)) {
        aOption.isSelected = true;
      } else {
        aOption.isSelected = false;
      }
    });
    this._filtersStateService.setEventDays(daysCopy);
  };

  onEventSelect(event: DropdownOption) {
    this._filtersStateService.setSelectedEvent(event);
  }
}

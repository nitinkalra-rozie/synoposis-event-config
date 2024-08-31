import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { EventCardType, EventDetailType, ScreenDisplayType } from 'src/app/shared/enums';

@Component({
  selector: 'app-screen-display',
  templateUrl: './screen-display.component.html',
  styleUrls: ['./screen-display.component.scss'],
})
export class ScreenDisplayComponent {
  selectedSessions: string[] = [];
  ScreenDisplayType = ScreenDisplayType;

  @Input() type: ScreenDisplayType;
  @Input() eventDays: string[] = [];
  @Input() sessionTitles: string[] = [];
  @Input() title: string = '';
  @Input() selectedSessionType: string = '';
  @Input() sessionDay: string = '';
  @Input() icon: string | null = null;
  @Input() imageUrl: string;
  @Input() ShowCombineDropdown: boolean = false;
  @Input() shoEventDropDown: boolean = false;
  @Input() cards: Array<{
    displayFunction: () => void;
    title: string;
    imageUrl: string;
    daySelector?: boolean;
    icon?: string;
    cardType?: EventCardType;
  }> = [];
  @Input() sessionValueDropdown: boolean = false;
  @Input() subSessionValueDropdown: boolean = false;
  @Input() isSessionInProgress: boolean = false;
  @Input() showStartListeningButton: boolean = false;
  @Input() showStopScreenButton: boolean = false;

  @Output() startListening: EventEmitter<void> = new EventEmitter<void>();
  @Output() stopListening: EventEmitter<void> = new EventEmitter<void>();
  @Output() endSession: EventEmitter<void> = new EventEmitter<void>();

  @Output() onMainSessionChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() onSessionsChange: EventEmitter<{ values: string[] }> = new EventEmitter<{ values: string[] }>();
  @Output() onEventSpecificDayChange: EventEmitter<{ [key: string]: string }> = new EventEmitter<{
    [key: string]: string;
  }>();
  @Output() onMainSessionDayChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() onMultiSessionDayChange: EventEmitter<string> = new EventEmitter<string>();

  // startListeningClicked: boolean = false;
  // showStopScreenButtonClicked: boolean = false;

  eventDay: { [key: string]: string } = {
    [EventCardType.Welcome]: '',
    [EventCardType.ThankYou]: '',
    [EventCardType.Info]: '',
  };

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionTitles'] && changes['sessionTitles'].currentValue) {
      if (changes['sessionTitles'].currentValue != changes['sessionTitles'].previousValue) {
        if (this.isSessionInProgress) {
          this.selectedSessions = [localStorage.getItem('currentSessionTitle') || ''];
        } else {
          this.selectedSessions = [changes['sessionTitles'].currentValue[0]];
        }
        if (this.type === ScreenDisplayType.MultiSession) {
          this.onMainSessionChange.emit(changes['sessionTitles'].currentValue[0]);
        }
        if (this.type === ScreenDisplayType.SessionSpecific) {
          this.onSessionsChange.emit({ values: [changes['sessionTitles'].currentValue[0]] });
        }
      }
    }

    if (changes['eventDays']) {
      if (this.type === ScreenDisplayType.EventSpecific) {
        this.eventDay = {
          [EventCardType.Welcome]: changes['eventDays'].currentValue[0],
          [EventCardType.ThankYou]: changes['eventDays'].currentValue[0],
          [EventCardType.Info]: changes['eventDays'].currentValue[0],
        };
        this.onEventSpecificDayChange.emit(this.eventDay);
      }
    }
  }

  cardDisplayFunction(displayFunction: () => void) {
    if (displayFunction) {
      displayFunction();
    }
  }

  onStartListening(): void {
    this.startListening.emit();
  }

  onStopListening(): void {
    this.stopListening.emit();
  }

  onEndSession(): void {
    this.endSession.emit();
  }

  handleEventDayDropdownSelect = (value: string, cardType: EventCardType) => {
    this.eventDay[cardType] = value;
    this.onEventSpecificDayChange.emit(this.eventDay);
  };

  handleSessionDayDropdownSelect = (value: string) => {
    if (this.type === ScreenDisplayType.SessionSpecific) {
      this.onMainSessionDayChange.emit(value);
    }
    if (this.type === ScreenDisplayType.MultiSession) {
      this.onMultiSessionDayChange.emit(value);
    }
  };

  handleSelectSessionSelect = (value: string) => {
    let tempArray = [value];
    this.selectedSessions = [...tempArray];
    this.onMainSessionChange.emit(value);
  };

  handleSelectSessionsSelect = (value: string) => {
    let tempArray = [];
    if (this.selectedSessions.includes(value)) {
      this.selectedSessions.forEach(element => {
        if (element !== value) {
          tempArray.push(element);
        }
      });
    } else {
      tempArray = [...this.selectedSessions];
      tempArray.push(value);
    }
    this.selectedSessions = [...tempArray];
    this.onSessionsChange.emit({ values: [...tempArray] });
  };

  getEndButtonText = () => {
    if (this.selectedSessionType === EventDetailType.BreakoutSession) {
      return 'End Breakout Session';
    }

    if (this.selectedSessionType === EventDetailType.IntroSession) {
      return 'End Intro Session';
    }

    return 'End Session';
  };
}

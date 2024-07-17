import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-screen-display',
  templateUrl: './screen-display.component.html',
  styleUrls: ['./screen-display.component.css'],
})
export class ScreenDisplayComponent {
  selectedSessions: string[] = [];

  @Input() eventDays: string[] = [];
  @Input() sessionTitles: string[] = [];
  @Input() title: string = '';
  @Input() icon: string | null = null;
  @Input() imageUrl: string;
  @Input() showStartListeningButton: boolean = false;
  @Input() showStopScreenButton: boolean = false;
  @Input() ShowCombineDropdown: boolean = false;
  @Input() shoEventDropDown: boolean = false;
  @Input() cards: Array<{ title: string; imageUrl: string; icon?: string }> = [];
  @Input() sessionValueDropdown: boolean = false;
  @Input() subSessionValueDropdown: boolean = false;
  @Output() startListening: EventEmitter<void> = new EventEmitter<void>();
  @Output() stopScreen: EventEmitter<void> = new EventEmitter<void>();
  @Output() endSession: EventEmitter<void> = new EventEmitter<void>();
  @Output() onMainSessionChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() onMainSessionDayChange: EventEmitter<string> = new EventEmitter<string>();

  startListeningClicked: boolean = false;
  showStopScreenButtonClicked: boolean = false;

  eventDay: string = '';
  sessionDay: string = '';

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventDays']) {
      this.eventDay = changes['eventDays'].currentValue[0];
      this.sessionDay = changes['eventDays'].currentValue[0];
      if (!this.subSessionValueDropdown) {
        this.onMainSessionDayChange.emit(changes['eventDays'].currentValue[0]);
      }
    }

    if (changes['sessionTitles'] && changes['sessionTitles'].currentValue) {
      this.selectedSessions = [changes['sessionTitles'].currentValue[0]];
      this.onMainSessionChange.emit(changes['sessionTitles'].currentValue[0]);
    }
  }

  cardDisplayFunction(displayFunction: () => void) {
    if (displayFunction) {
      displayFunction();
    }
  }
  onStartListening() {
    this.startListeningClicked = true;
    this.showStopScreenButtonClicked = true;
    this.startListening.emit();
  }

  onStopScreen() {
    this.showStopScreenButtonClicked = false;
    this.startListeningClicked = false;
    this.stopScreen.emit();
  }

  onEndSession() {
    this.endSession.emit();
  }

  handleEventDayDropdownSelect = (value: string) => {
    this.eventDay = value;
  };

  handleSessionDayDropdownSelect = (value: string) => {
    this.sessionDay = value;
    if (!this.subSessionValueDropdown) {
      this.onMainSessionDayChange.emit(value);
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
  };
}

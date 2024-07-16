import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-screen-display',
  templateUrl: './screen-display.component.html',
  styleUrls: ['./screen-display.component.css'],
})
export class ScreenDisplayComponent {

  multipleTestArray = ['Value 1', 'Value 2', 'Value 3'];
  selectedValues = [];

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
@Output() endSession: EventEmitter<void>= new EventEmitter<void>();


  constructor() { }

  ngOnInit() {}
  

  cardDisplayFunction(displayFunction: () => void) {
    if (displayFunction) {
      displayFunction();
    }
  }
  onStartListening() {
    this.startListening.emit();
  }

  onStopScreen() {
    this.stopScreen.emit();
  }

  onEndSession() {
    this.endSession.emit();
  }

  handleDropdownSelect = (value: string) => {
    let tempArray = [];
    if (this.selectedValues.includes(value)) {
      this.selectedValues.forEach(element => {
        if (element !== value) {
          tempArray.push(element);
        }
      });
    } else {
      tempArray = [...this.selectedValues];
      tempArray.push(value);
    }
    this.selectedValues = [...tempArray];
  };
}



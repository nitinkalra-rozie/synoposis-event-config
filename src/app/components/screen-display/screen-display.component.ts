import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-screen-display',
  templateUrl: './screen-display.component.html',
  styleUrls: ['./screen-display.component.css'],
})
export class ScreenDisplayComponent implements OnInit {
  multipleTestArray = ['Value 1', 'Value 2', 'Value 3'];
  selectedValues = [];

  @Input() title: string = '';
  @Input() icon: string | null = null;
  @Input() imageUrl: string;
  @Input() showStartListeningButton: boolean = false;
  @Input() showStopScreenButton: boolean = false;
  @Input() ShowCombineDropdown: boolean = false;
  @Input() cards: Array<{ title: string; imageUrl: string; icon?: string }> = [];
  @Input() sessionValueDropdown: boolean = false;
  @Input() subSessionValueDropdown: boolean = false;
  constructor() {}

  ngOnInit() {}
  startListening() {}
  stopScreen() {}

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

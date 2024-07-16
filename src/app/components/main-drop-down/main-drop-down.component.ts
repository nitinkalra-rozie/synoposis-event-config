import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-main-drop-down",
  templateUrl: "./main-drop-down.component.html",
  styleUrls: ["./main-drop-down.component.css"],
})
export class MainDropDownComponent implements OnInit {
  dropDownVisible: boolean = false;

  @Input() selectedValue = ["value"];
  @Input() type = 't1';
  @Input() dropdownContent = ["value"];
  @Input() dropdownTitle: string | undefined;
  @Output() onDropdownSelect: EventEmitter<string>;

  constructor() {
    this.onDropdownSelect = new EventEmitter();

  }

  ngOnInit() {
    console.log('selectedValue', this.selectedValue);
  }

  toggleDropdown = () => {
    this.dropDownVisible = !this.dropDownVisible;
  };

  onOutsideClick = () => {
    if (this.dropDownVisible) {
      this.dropDownVisible = false;
    }
  };

  handleDropDownSelect = (value: string) => {
    if(this.onDropdownSelect){
      this.onDropdownSelect.emit(value);
    }
    this.toggleDropdown();
  };
}

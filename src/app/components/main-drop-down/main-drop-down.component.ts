import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-main-drop-down",
  templateUrl: "./main-drop-down.component.html",
  styleUrls: ["./main-drop-down.component.css"],
})
export class MainDropDownComponent implements OnInit {
  dropDownVisible: boolean = false;

  @Input() dropdownContent = ["value"];
  @Input() dropdownTitle: string | undefined;

  constructor() {}

  ngOnInit() {
    // console.log('dropdownContent', this.dropdownContent);
  }

  toggleDropdown = () => {
    this.dropDownVisible = !this.dropDownVisible;
  };

  onOutsideClick = () => {    
    if (this.dropDownVisible) {
      this.dropDownVisible = false;
    }
  };
}

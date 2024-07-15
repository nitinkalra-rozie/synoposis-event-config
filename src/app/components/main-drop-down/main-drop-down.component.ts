import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-main-drop-down",
  templateUrl: "./main-drop-down.component.html",
  styleUrls: ["./main-drop-down.component.css"],
})
export class MainDropDownComponent implements OnInit {
  dropDownVisible: boolean = false;

  @Input() dropdownContent = [{ label: "label", value: "value" }];
  @Input() dropdownTitle: string | undefined;

  constructor() {}

  ngOnInit() {}

  toggleDropdown = () => {
    this.dropDownVisible = !this.dropDownVisible;
    console.log("this.dropDownVisible", this.dropDownVisible);
  };
}

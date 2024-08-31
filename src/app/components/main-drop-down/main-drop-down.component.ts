import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TruncatePipe } from '../../@pipes/truncate.pipe';
import { OutsideClickDirective } from '../../directives/outside-click.directive';

@Component({
    selector: 'app-main-drop-down',
    templateUrl: './main-drop-down.component.html',
    styleUrls: ['./main-drop-down.component.scss'],
    standalone: true,
    imports: [OutsideClickDirective, TruncatePipe],
})
export class MainDropDownComponent implements OnInit {
  dropDownVisible: boolean = false;

  @Input() selectedValue = ['value'];
  @Input() type = 't1';
  @Input() disabled: boolean = false;
  @Input() dropdownContent = ['value'];
  @Input() dropdownTitle: string | undefined;
  @Input() dropdownContentTitle: string = 'Select';
  @Output() onDropdownSelect: EventEmitter<string>;

  constructor() {
    this.onDropdownSelect = new EventEmitter();
  }

  ngOnInit() {}

  toggleDropdown = () => {
    this.dropDownVisible = !this.dropDownVisible;
  };

  onOutsideClick = () => {
    if (this.dropDownVisible) {
      this.dropDownVisible = false;
    }
  };

  handleDropDownSelect = (value: string) => {
    if (this.onDropdownSelect) {
      this.onDropdownSelect.emit(value);
    }
    this.toggleDropdown();
  };

  handleT4DropDownSelect = (value: string) => {
    if (this.onDropdownSelect) {
      this.onDropdownSelect.emit(value);
    }
  };

  getT4Content = () => {
    const newContent = this.dropdownContent.map(item => {
      if (this.selectedValue.includes(item)) {
        return { checked: true, label: item };
      }

      return { checked: false, label: item };
    });

    return newContent;
  };

  isMobileDevice = () => {
    return window.innerWidth < 768;
  };

  truncateText = (text = '', maxLengthDesktop, maxLengthMobile) => {
    const maxLength = this.isMobileDevice() ? maxLengthMobile : maxLengthDesktop;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  getSelectedText = () => {
    const maxLengthDesktop = 40;
    const maxLengthMobile = 25;

    const tempText = this.truncateText(this.selectedValue[0], maxLengthDesktop, maxLengthMobile);
    if (this.selectedValue && this.selectedValue.length === 1) {
      return tempText;
    } else if (this.selectedValue && this.selectedValue.length > 1) {
      return `${tempText} +`;
    }
  };
}

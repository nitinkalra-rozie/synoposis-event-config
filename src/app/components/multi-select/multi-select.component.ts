import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  input,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GetCheckboxOptionFromMultiSelectPipe,
  GetFilteredMultiSelectOptionsPipe,
  GetSelectedOptionsPipe,
} from '@syn/pipes';
import { getUUID } from '@syn/utils';
import { CheckboxOption } from 'src/app/models/elsa-checkbox';
import { MultiSelectOption } from 'src/app/models/multi-select';
import { ElsaCheckboxComponent } from '../elsa-checkbox/elsa-checkbox.component';

@Component({
  selector: 'app-multi-select',
  standalone: true,
  providers: [
    GetCheckboxOptionFromMultiSelectPipe,
    GetSelectedOptionsPipe,
    GetFilteredMultiSelectOptionsPipe,
  ],
  imports: [
    NgOptimizedImage,
    NgClass,
    ElsaCheckboxComponent,
    GetCheckboxOptionFromMultiSelectPipe,
    GetSelectedOptionsPipe,
    FormsModule,
    GetFilteredMultiSelectOptionsPipe,
  ],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
})
export class MultiSelectComponent implements OnInit {
  @ViewChild('dropdownContainer')
  protected dropdownContainer: ElementRef<HTMLDivElement>;

  public options = input.required<MultiSelectOption[]>();
  public label = input<string>();
  public selectedLabelKey = input<string>();
  public styleConfig = input<{
    width: number;
  }>({
    width: 240,
  });

  public optionSelected = output<MultiSelectOption[]>();

  protected fixedOption: CheckboxOption<string> = {
    label: 'All',
    value: 'All',
    isChecked: false,
  };
  protected searchText: string = '';
  protected isDropdownOpen: boolean = false;
  protected elementId: string;

  @HostListener('document:mousedown', ['$event'])
  mousedown(e: Event): void {
    const target = e.target as HTMLElement;
    const parentClass = target.closest('.select-container');
    const parentId = target.closest(`#${this.elementId}`);

    if (!(parentClass && parentId)) {
      this.isDropdownOpen = false;
      this.dropdownContainer.nativeElement.classList.remove('visible');
      setTimeout(() => {
        this.dropdownContainer.nativeElement.style.display = 'none';
      }, 300);
    }
  }

  ngOnInit(): void {
    document.documentElement.style.setProperty(
      '--checkbox-label-max-length',
      `${this.styleConfig().width - 72}px`
    );

    this.elementId = getUUID();

    // this.onAllOptionToggle(this.fixedOption);
  }

  protected onAllOptionToggle(selectedOption: CheckboxOption<string>): void {
    this.fixedOption.isChecked = !selectedOption.isChecked;
    this.optionSelected.emit(this.options());
  }

  protected onCustomOptionToggle(
    selectedOption: CheckboxOption<MultiSelectOption>
  ): void {
    console.log('onCustomOptionToggle', selectedOption);
  }

  protected onDropdownToggle(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (!this.isDropdownOpen) {
      this.dropdownContainer.nativeElement.classList.remove('visible');
      setTimeout(() => {
        this.dropdownContainer.nativeElement.style.display = 'none';
      }, 300);
    } else {
      this.dropdownContainer.nativeElement.style.display = 'block';
      setTimeout(() => {
        this.dropdownContainer.nativeElement.classList.add('visible');
      });
    }
  }
}

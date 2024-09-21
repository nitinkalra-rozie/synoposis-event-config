import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  input,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SynCheckboxComponent } from '@syn/components';
import { OverflowDetectorDirective } from '@syn/directives';
import { CheckboxOption, DropdownOption, RightSidebarState } from '@syn/models';
import {
  GetCheckboxOptionFromMultiSelectPipe,
  GetFilteredDropdownOptionsPipe,
  GetSelectedOptionsPipe,
} from '@syn/pipes';
import { GlobalStateService } from '@syn/services';
import { generateUniqueId } from '@syn/utils';
import { isEqual } from 'lodash';

@Component({
  selector: 'app-syn-multi-select',
  standalone: true,
  providers: [
    GetCheckboxOptionFromMultiSelectPipe,
    GetSelectedOptionsPipe,
    GetFilteredDropdownOptionsPipe,
  ],
  imports: [
    NgOptimizedImage,
    NgClass,
    SynCheckboxComponent,
    GetCheckboxOptionFromMultiSelectPipe,
    GetSelectedOptionsPipe,
    FormsModule,
    GetFilteredDropdownOptionsPipe,
    MatTooltipModule,
    OverflowDetectorDirective,
  ],
  templateUrl: './syn-multi-select.component.html',
  styleUrl: './syn-multi-select.component.scss',
})
export class SynMultiSelectComponent implements OnInit {
  constructor(private _globalStateService: GlobalStateService) {
    effect(() => {
      if (!isEqual(this.options(), this.optionsRef)) {
        this.optionsRef = structuredClone(this.options());
        this.onAllOptionToggle(this.fixedOption);
      }
    });
  }

  @ViewChild('dropdownContainer')
  protected dropdownContainer: ElementRef<HTMLDivElement>;

  public options = input.required<DropdownOption[]>();
  public label = input<string>();
  public selectedLabelKey = input<string>();
  // public styleConfig = input<{
  //   width: number;
  // }>({
  //   width: 240,
  // });

  public optionSelected = output<DropdownOption[]>();

  protected fixedOption: CheckboxOption<string> = {
    label: 'All',
    value: 'All',
    isChecked: false,
  };
  protected searchText: string = '';
  protected isDropdownOpen: boolean = false;
  protected elementId: string;
  protected optionsRef: DropdownOption[] = [];
  protected isLabelTooltipVisible: boolean = false;
  protected RightSidebarState = RightSidebarState;
  protected rightSidebarState = computed(() =>
    this._globalStateService.rightSidebarState()
  );

  @HostListener('document:mousedown', ['$event'])
  mousedown(e: Event): void {
    const target = e.target as HTMLElement;
    const parentClass = target.closest('.select-container');
    const parentId = target.closest(`#${this.elementId}`);

    if (!(parentClass && parentId) && this.isDropdownOpen) {
      this.closeDropdown();
      this.resetFields();
    }
  }

  ngOnInit(): void {
    // document.documentElement.style.setProperty(
    //   '--checkbox-label-max-length',
    //   `${this.styleConfig().width - 72}px`
    // );
    this.elementId = generateUniqueId();
  }

  protected onAllOptionToggle(selectedOption: CheckboxOption<string>): void {
    this.fixedOption.isChecked = !selectedOption.isChecked;
    if (this.fixedOption.isChecked) {
      this.optionsRef = [
        ...this.optionsRef.map((aOption) => ({
          ...aOption,
          isSelected: true,
        })),
      ];
    } else {
      this.optionsRef = [
        ...this.optionsRef.map((aOption) => ({
          ...aOption,
          isSelected: false,
        })),
      ];
    }
  }

  protected onCustomOptionToggle(
    selectedOption: CheckboxOption<DropdownOption>
  ): void {
    this.optionsRef = [
      ...this.optionsRef.map((aOption) => {
        if (aOption.label === selectedOption.label) {
          return {
            ...aOption,
            isSelected: !aOption.isSelected,
          };
        }
        return aOption;
      }),
    ];

    if (this.optionsRef.every((aOption) => aOption.isSelected)) {
      this.fixedOption.isChecked = true;
    } else {
      this.fixedOption.isChecked = false;
    }
  }

  protected onDropdownToggle(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.dropdownContainer.nativeElement.style.display = 'block';
      setTimeout(() => {
        this.dropdownContainer.nativeElement.classList.add('visible');
      });
    } else {
      this.closeDropdown();
      this.resetFields();
    }
  }

  protected onApplySelection = (): void => {
    this.optionSelected.emit(this.optionsRef);
    this.closeDropdown();
    this.searchText = '';
  };

  private resetFields = (): void => {
    this.searchText = '';
    if (this.options().some((aOption) => !aOption.isSelected)) {
      this.fixedOption.isChecked = false;
    } else {
      this.fixedOption.isChecked = true;
    }
    this.optionsRef = structuredClone(this.options());
  };

  private closeDropdown = (): void => {
    this.isDropdownOpen = false;
    this.dropdownContainer.nativeElement.classList.remove('visible');
    setTimeout(() => {
      this.dropdownContainer.nativeElement.style.display = 'none';
    }, 300);
  };
}

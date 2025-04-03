import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isEqual } from 'lodash-es';
import { SynCheckboxComponent } from 'src/app/legacy-admin/@components/syn-checkbox';
import { OverflowDetectorDirective } from 'src/app/legacy-admin/@directives/overflow-detector.directive';
import { CheckboxOption } from 'src/app/legacy-admin/@models/checkbox';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { GetCheckboxOptionFromMultiSelectPipe } from 'src/app/legacy-admin/@pipes/get-checkbox-option-from-multi-select.pipe';
import { GetFilteredDropdownOptionsPipe } from 'src/app/legacy-admin/@pipes/get-filtered-dropdown-options.pipe';
import { GetSelectedOptionsPipe } from 'src/app/legacy-admin/@pipes/get-selected-options.pipe';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { generateUniqueId } from 'src/app/legacy-admin/@utils/generate-uuid';

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
    MatMenuModule,
    MatMenuTrigger,
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
  public dropdownSearchInputPlaceholder = input<string>('Search');
  public size = input<'small' | 'default'>('default');
  public selectedLabelKey = input<string>();

  public optionSelected = output<DropdownOption[]>();

  protected fixedOption: CheckboxOption<string> = {
    label: 'All',
    value: 'All',
    isChecked: false,
  };
  protected searchText: string = '';
  protected elementId: string;
  protected optionsRef: DropdownOption[] = [];
  protected isLabelTooltipVisible: boolean = false;
  protected RightSidebarState = RightSidebarState;
  protected rightSidebarState = computed(() =>
    this._globalStateService.rightSidebarState()
  );

  ngOnInit(): void {
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

  protected onApplySelection = (): void => {
    this.optionSelected.emit(this.optionsRef);
    this.searchText = '';
  };

  protected closeDropdown = (): void => {
    this.resetFields();
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
}

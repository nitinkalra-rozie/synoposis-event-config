import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  MatOption,
  MatSelect,
  MatSelectModule,
} from '@angular/material/select';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import {
  SynMultiSelectConfig,
  SynMultiSelectOption,
} from './syn-multi-select-option.model';

@Component({
  selector: 'syn-multi-select',
  templateUrl: './syn-multi-select.html',
  styleUrl: './syn-multi-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class SynMultiSelect<T> implements OnChanges {
  constructor() {
    this.searchFormCtrl.valueChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(100),
        distinctUntilChanged(),
        tap((value) => this._filterSearchOptions(value))
      )
      .subscribe();
  }

  protected readonly ALL_OPTION = '(All)';

  public matMultiSelectRef = viewChild<MatSelect>('matMultiSelect');

  public options = input<SynMultiSelectOption<T>[] | string[]>();
  public labelIcon = input.required<string>();
  public labelText = input.required<string>();
  public uiConfig = input<SynMultiSelectConfig>({
    applyFilterButtonText: 'Apply filter',
    labelSearch: 'Search',
    labelPosition: 'before',
  });
  public theme = input<'default' | 'transparent'>('default');

  public selectionsApplied = output<SynMultiSelectOption<T>[] | string[]>();

  protected selectFormCtrl = new FormControl();
  protected searchFormCtrl = new FormControl();

  protected filteredOptions = signal<(SynMultiSelectOption<T> | string)[]>([]);

  ngOnChanges(_changes: SimpleChanges): void {
    this._filterSearchOptions();
  }

  protected get selectedFirstValue(): string {
    const value = this.selectFormCtrl.value?.[0];
    return typeof value === 'string' ? value : value?.label;
  }

  protected displayOption(option: string | SynMultiSelectOption<T>): string {
    return typeof option === 'string' ? option : option.label;
  }

  protected toggleAllChange(
    allOptionItem: MatOption<string>,
    event?: MatOptionSelectionChange<string>
  ): void {
    if (event?.isUserInput) {
      this.selectFormCtrl.setValue(
        allOptionItem.selected ? this.options() : []
      );
      if (allOptionItem.selected) {
        allOptionItem.select();
      }
    }
  }

  protected toggleOptionChange(
    optionItem: MatOption<string | SynMultiSelectOption<T>>,
    event?: MatOptionSelectionChange<string | SynMultiSelectOption<T>>
  ): void {
    if (event?.isUserInput) {
      const formValue = this.selectFormCtrl.value || [];
      const optionValue = optionItem.value;

      if (optionItem.selected) {
        this._addOptionToFormValue(formValue, optionValue);
      } else {
        this._removeOptionFromFormValue(formValue, optionValue);
      }

      if (
        formValue.length === this.options()?.length &&
        this.options()?.length != 1
      ) {
        this._addOptionToFormValue(formValue, this.ALL_OPTION);
      }
    }
  }

  protected applySelection(): void {
    this.selectionsApplied.emit(
      this.selectFormCtrl.value.filter(
        (value: string) => value !== this.ALL_OPTION
      )
    );
    this.matMultiSelectRef()?.close();
  }

  private _addOptionToFormValue(
    formValue: (string | SynMultiSelectOption<T>)[],
    optionValue: string | SynMultiSelectOption<T>
  ): void {
    formValue.push(optionValue);
    this.selectFormCtrl.patchValue(formValue);
  }

  private _removeOptionFromFormValue(
    formValue: (string | SynMultiSelectOption<T>)[],
    optionValue: string | SynMultiSelectOption<T>
  ): void {
    const index = formValue.indexOf(optionValue);
    if (index > -1) {
      formValue.splice(index, 1);
    }
    if (formValue.includes(this.ALL_OPTION)) {
      formValue.splice(formValue.indexOf(this.ALL_OPTION), 1);
    }
    this.selectFormCtrl.patchValue(formValue);
  }

  private _filterSearchOptions(searchValue?: string): void {
    const options = this.options() ?? [];
    if (!searchValue) {
      this.filteredOptions.set(options);
      return;
    }

    const filtered = options.filter((option) => {
      const displayText = typeof option === 'string' ? option : option.label;
      return displayText?.toLowerCase().includes(searchValue.toLowerCase());
    });

    this.filteredOptions.set(filtered);
  }
}

import { NgClass, TitleCasePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  output,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  MatOption,
  MatSelect,
  MatSelectModule,
} from '@angular/material/select';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { TooltipOnOverflow } from 'src/app/shared/directives/tooltip-on-overflow';
import { SynSingleSelectOption } from './syn-single-select-option.model';
import { SynSingleSelectPlaceholder } from './syn-single-select-placeholder';

@Component({
  selector: 'syn-single-select',
  templateUrl: './syn-single-select.html',
  styleUrl: './syn-single-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    TitleCasePipe,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    TooltipOnOverflow,
    SynSingleSelectPlaceholder,
  ],
})
export class SynSingleSelect<T> {
  constructor() {
    this.searchFormCtrl.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        tap((value) => this._filterSearchOptions(value)),
        takeUntilDestroyed()
      )
      .subscribe();

    effect(() => {
      if (this.disabled()) {
        this.selectFormCtrl.disable();
      } else {
        this.selectFormCtrl.enable();
      }
    });

    effect(() => {
      const selectedKey = this.selectedOptionKey();
      const options = this.options();

      if (!selectedKey) {
        this.selectFormCtrl.setValue(null, { emitEvent: false });
        return;
      }

      const selectedOption = options?.find((option) => {
        if (typeof option === 'string') {
          return option === selectedKey;
        }
        return option.value === selectedKey;
      });

      if (selectedOption) {
        this.selectFormCtrl.setValue(selectedOption);
      }
    });
  }

  public readonly matSingleSelectRef = viewChild<MatSelect>('matSingleSelect');

  public readonly options = input.required<
    SynSingleSelectOption<T>[] | string[]
  >();
  public readonly placeholder = input.required<string>();
  public readonly searchLabel = input.required<string>();
  public readonly optionsType = input.required<string>();
  public readonly selectedOptionKey = input<string | null>(null);
  public readonly isLoading = input<boolean>(false);
  public readonly disabled = input<boolean>(false);
  public readonly labelIcon = input<string>();
  public readonly labelText = input<string>();
  public readonly labelPosition = input<'before' | 'after'>('before');
  public readonly theme = input<'default' | 'transparent'>('default');
  public readonly appearance = input<'fill' | 'outline'>('fill');

  public readonly dropdownOpened = output<boolean>();
  public readonly selectionChanged = output<
    SynSingleSelectOption<T> | string | null
  >();

  private readonly _injector = inject(Injector);

  protected selectFormCtrl = new FormControl<
    SynSingleSelectOption<T> | string | null
  >(null);
  protected searchFormCtrl = new FormControl<string>('');

  protected filteredOptions = signal<(SynSingleSelectOption<T> | string)[]>([]);

  protected displayState = computed(() => {
    const searchValue = this.searchFormCtrl.value || '';
    const filtered = this.filteredOptions();
    const allOptions = this.options() ?? [];

    if (allOptions.length === 0) {
      return {
        options: [],
        showNoSearchResults: false,
        showNoOptions: true,
      };
    }

    if (!searchValue.trim()) {
      return {
        options: allOptions,
        showNoSearchResults: false,
        showNoOptions: false,
      };
    }

    if (filtered.length > 0) {
      return {
        options: filtered,
        showNoSearchResults: false,
        showNoOptions: false,
      };
    }

    return {
      options: allOptions,
      showNoSearchResults: true,
      showNoOptions: false,
    };
  });

  protected optionDisplayMap = computed(() => {
    const options = this.options();
    const map = new Map<SynSingleSelectOption<T> | string, string>();

    options.forEach((option: SynSingleSelectOption<T> | string) => {
      const displayText = typeof option === 'string' ? option : option.label;
      map.set(option, displayText);
    });

    return map;
  });

  protected selectedValue = computed(() => {
    const value = this._selectFormValueSignal();
    if (!value) return '';
    return typeof value === 'string' ? value : value.label;
  });

  private _selectFormValueSignal = toSignal(this.selectFormCtrl.valueChanges, {
    initialValue: null as SynSingleSelectOption<T> | string | null,
  });

  protected compareWith(
    o1: SynSingleSelectOption<T> | string,
    o2: SynSingleSelectOption<T> | string
  ): boolean {
    if (!o1 || !o2) return o1 === o2;

    if (typeof o1 === 'string' && typeof o2 === 'string') {
      return o1 === o2;
    }

    if (typeof o1 === 'object' && typeof o2 === 'object') {
      return o1.value === o2.value;
    }

    return false;
  }

  protected onSelectionChange(
    optionItem: MatOption<string | SynSingleSelectOption<T>>,
    event?: MatOptionSelectionChange<string | SynSingleSelectOption<T>>
  ): void {
    if (event?.isUserInput && optionItem.selected && optionItem.value != null) {
      this.selectFormCtrl.setValue(optionItem.value);
      this.selectionChanged.emit(optionItem.value);
      this.matSingleSelectRef()?.close();
    }
  }

  protected onDropdownOpenedChange(isOpen: boolean): void {
    this.dropdownOpened.emit(isOpen);
    if (isOpen && this.selectFormCtrl.value) {
      runInInjectionContext(this._injector, () => {
        afterNextRender(() => {
          this._scrollToSelectedOption();
        });
      });
    }
  }

  private _scrollToSelectedOption(): void {
    const matSelect = this.matSingleSelectRef();
    if (matSelect?.panel) {
      const selectedOption = matSelect.panel.nativeElement.querySelector(
        '.mat-mdc-option.mdc-list-item--selected'
      );
      selectedOption?.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      });
    }
  }

  private _filterSearchOptions(searchValue?: string): void {
    const options = this.options() ?? [];
    if (!searchValue?.trim()) {
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

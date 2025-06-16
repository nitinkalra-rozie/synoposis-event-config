import { NgClass, TitleCasePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  OnChanges,
  output,
  runInInjectionContext,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { SynSingleSelectOption } from './syn-single-select-option.model';

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
  ],
})
export class SynSingleSelect<T> implements OnChanges {
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

  public readonly matSingleSelectRef = viewChild<MatSelect>('matSingleSelect');

  public readonly options = input.required<
    SynSingleSelectOption<T>[] | string[]
  >();
  public readonly placeholder = input.required<string>();
  public readonly searchLabel = input.required<string>();
  public readonly optionsType = input.required<string>();
  public readonly labelIcon = input<string>();
  public readonly labelText = input<string>();
  public readonly labelPosition = input<'before' | 'after'>('before');
  public readonly theme = input<'default' | 'transparent'>('default');
  public readonly appearance = input<'fill' | 'outline'>('fill');

  public readonly selectionChanged = output<
    SynSingleSelectOption<T> | string | null
  >();

  private readonly _injector = inject(Injector);

  protected selectFormCtrl = new FormControl();
  protected searchFormCtrl = new FormControl();

  protected filteredOptions = signal<(SynSingleSelectOption<T> | string)[]>([]);

  protected displayState = computed(() => {
    const searchValue = this.searchFormCtrl.value;
    const filtered = this.filteredOptions();
    const allOptions = this.options() ?? [];

    if (!searchValue) {
      return { options: allOptions, showNoResults: false };
    }

    if (filtered.length > 0) {
      return { options: filtered, showNoResults: false };
    }

    return { options: allOptions, showNoResults: true };
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

  ngOnChanges(_changes: SimpleChanges): void {
    this._filterSearchOptions();
  }

  protected get selectedValue(): string {
    const value = this.selectFormCtrl.value;
    if (!value) return '';
    return typeof value === 'string' ? value : value.label;
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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { SynMenuMultiSelectOption } from 'src/app/shared/components/syn-menu-multi-select/syn-menu-multi-select-option.model';

@Component({
  selector: 'syn-menu-multi-select',
  templateUrl: './syn-menu-multi-select.html',
  styleUrl: './syn-menu-multi-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    ReactiveFormsModule,
  ],
})
export class SynMenuMultiSelect<T> implements OnChanges {
  constructor() {
    this.searchFormCtrl.valueChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(100),
        distinctUntilChanged(),
        tap((value) => this._filterSearchOptions(value || ''))
      )
      .subscribe();
  }

  protected readonly ALL_OPTION = '(All)';

  public menuTriggerRef = viewChild<MatMenuTrigger>('menuTrigger');
  public searchInputRef =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  public options = input<SynMenuMultiSelectOption<T>[] | string[]>();
  public labelIcon = input.required<string>();
  public labelText = input.required<string>();
  public theme = input<'default' | 'transparent'>('default');
  public disabled = input<boolean>(false);
  public maxHeight = input<string>('17.5rem');
  public showSelectAllOption = input<boolean>(true);
  public applyFilterButtonText = input<string>('Apply filter');
  public cancelButtonText = input<string>('Cancel');
  public searchLabel = input<string>('Search');
  public labelPosition = input<'before' | 'after'>('before');
  public searchPlaceholder = input<string>('Search');

  public selectionsApplied = output<SynMenuMultiSelectOption<T>[] | string[]>();

  protected filteredOptions = signal<(SynMenuMultiSelectOption<T> | string)[]>(
    []
  );
  protected isMenuOpen = signal<boolean>(false);

  protected selectedFirstValue = computed(() => {
    const selected = this._selectedItems();
    if (selected.length === 0) {
      return '';
    }
    const firstItem = selected.find((item) => item !== this.ALL_OPTION);
    return typeof firstItem === 'string' ? firstItem : firstItem?.label || '';
  });

  protected selectedCount = computed(
    () =>
      this._selectedItems().filter((item) => item !== this.ALL_OPTION).length
  );

  protected isAllSelected = computed(() => {
    const options = this.options() || [];
    const selected = this._selectedItems();
    const selectedWithoutAll = selected.filter(
      (item) => item !== this.ALL_OPTION
    );
    return options.length > 1 && selectedWithoutAll.length === options.length;
  });

  protected showAllOption = computed(
    () => this.showSelectAllOption() && this.filteredOptions().length > 1
  );

  protected selectedItemsSet = computed(() => new Set(this._selectedItems()));

  protected optionDisplayMap = computed(() => {
    const options = this.filteredOptions();
    const map = new Map<SynMenuMultiSelectOption<T> | string, string>();
    options.forEach((option) => {
      const displayText = typeof option === 'string' ? option : option.label;
      map.set(option, displayText);
    });
    return map;
  });

  protected searchFormCtrl = new FormControl<string>('');

  private _selectedItems = signal<(string | SynMenuMultiSelectOption<T>)[]>([]);
  private _searchValue = signal<string>('');
  private _originalSelectedItems = signal<
    (string | SynMenuMultiSelectOption<T>)[]
  >([]);

  ngOnChanges(_changes: SimpleChanges): void {
    const options = this.options() ?? [];
    this.filteredOptions.set(options);
    this._filterSearchOptions(this._searchValue());
  }

  protected onMenuOpened(): void {
    this.isMenuOpen.set(true);
    this._originalSelectedItems.set([...this._selectedItems()]);
    this.searchFormCtrl.setValue('');
    this._searchValue.set('');
    setTimeout(() => {
      this.searchInputRef()?.nativeElement?.focus();
    }, 100);
  }

  protected onMenuClosed(): void {
    this.isMenuOpen.set(false);
    this.searchFormCtrl.setValue('');
    this._searchValue.set('');
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (
      event.key === ' ' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      event.stopPropagation();
    }
  }

  protected toggleAllSelection(): void {
    const options = this.options() || [];

    if (this.isAllSelected()) {
      this._selectedItems.set([]);
    } else {
      this._selectedItems.set([this.ALL_OPTION, ...options]);
    }
  }

  protected toggleOptionSelection(
    option: string | SynMenuMultiSelectOption<T>
  ): void {
    const currentSelected = [...this._selectedItems()];
    const optionIndex = currentSelected.indexOf(option);

    if (optionIndex > -1) {
      currentSelected.splice(optionIndex, 1);
      const allIndex = currentSelected.indexOf(this.ALL_OPTION);
      if (allIndex > -1) {
        currentSelected.splice(allIndex, 1);
      }
    } else {
      currentSelected.push(option);

      const options = this.options() || [];
      const selectedWithoutAll = currentSelected.filter(
        (item) => item !== this.ALL_OPTION
      );

      if (selectedWithoutAll.length === options.length && options.length > 1) {
        currentSelected.unshift(this.ALL_OPTION);
      }
    }

    this._selectedItems.set(currentSelected);
  }

  protected applySelections(): void {
    const selected = this._selectedItems();
    const filtered = selected.filter((item) => item !== this.ALL_OPTION);
    this.selectionsApplied.emit(
      filtered as SynMenuMultiSelectOption<T>[] | string[]
    );
    this.menuTriggerRef()?.closeMenu();
  }

  protected cancelSelections(): void {
    this._selectedItems.set([...this._originalSelectedItems()]);
    this.menuTriggerRef()?.closeMenu();
  }

  private _filterSearchOptions(searchValue: string): void {
    this._searchValue.set(searchValue);
    const options = this.options() ?? [];

    if (!searchValue.trim()) {
      this.filteredOptions.set(options);
    } else {
      const filtered = options.filter((option) => {
        const displayText = typeof option === 'string' ? option : option.label;
        return displayText?.toLowerCase().includes(searchValue.toLowerCase());
      });
      this.filteredOptions.set(filtered);
    }
  }
}

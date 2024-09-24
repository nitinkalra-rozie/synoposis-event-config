import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverflowDetectorDirective } from '@syn/directives';
import {
  DropdownOption,
  RightSidebarState,
  SingleSelectUiConfig,
} from '@syn/models';
import { GetFilteredDropdownOptionsPipe } from '@syn/pipes';
import { GlobalStateService } from '@syn/services';
import { generateUniqueId } from '@syn/utils';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-syn-single-select',
  standalone: true,
  providers: [GetFilteredDropdownOptionsPipe],
  imports: [
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    NgClass,
    OverflowDetectorDirective,
    ReactiveFormsModule,
    GetFilteredDropdownOptionsPipe,
  ],
  templateUrl: './syn-single-select.component.html',
  styleUrl: './syn-single-select.component.scss',
})
export class SynSingleSelectComponent implements OnInit, AfterViewInit {
  @ViewChild(MatMenuTrigger) protected dropdownTrigger: MatMenuTrigger;

  public options = input.required<DropdownOption[]>();
  public selectedOption = input.required<DropdownOption | null>();
  public uiConfig = input<SingleSelectUiConfig>();
  public size = input<'small' | 'default'>('default');

  public optionSelected = output<DropdownOption>();
  public dropdownOpened = output<void>();

  protected isLabelTooltipVisible: boolean = false;
  protected isListItemTooltipVisible: boolean = false;
  protected filterForm: FormGroup<{ filterText: FormControl<string> }>;
  protected debouncedFilterText: string;
  protected rightSidebarState = computed(() =>
    this._globalState.rightSidebarState()
  );
  protected RightSidebarState = RightSidebarState;
  protected elementId: string;
  private _globalState = inject(GlobalStateService);

  ngOnInit(): void {
    this.elementId = generateUniqueId();

    this.filterForm = new FormGroup({
      filterText: new FormControl<string>(''),
    });

    this.filterForm.valueChanges.pipe(debounceTime(100)).subscribe((value) => {
      this.debouncedFilterText = value.filterText;
    });
  }

  ngAfterViewInit(): void {
    this.dropdownTrigger.menuOpened.subscribe(() => {
      this.dropdownOpened.emit();
    });
  }

  protected onOptionSelect(option: DropdownOption): void {
    this.optionSelected.emit(option);
  }
}

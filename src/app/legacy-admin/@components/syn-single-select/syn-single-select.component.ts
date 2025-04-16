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
import { debounceTime } from 'rxjs/operators';
import { OverflowDetectorDirective } from 'src/app/legacy-admin/@directives/overflow-detector.directive';
import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';
import { RightSidebarState } from 'src/app/legacy-admin/@models/global-state';
import { SingleSelectUiConfig } from 'src/app/legacy-admin/@models/single-select';
import { GetFilteredDropdownOptionsPipe } from 'src/app/legacy-admin/@pipes/get-filtered-dropdown-options.pipe';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { generateUniqueId } from 'src/app/legacy-admin/@utils/generate-uuid';

@Component({
  selector: 'app-syn-single-select',
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
  public disabled = input<boolean>(false);

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

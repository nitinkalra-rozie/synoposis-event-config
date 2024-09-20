import { NgClass } from '@angular/common';
import { Component, input, OnInit, output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverflowDetectorDirective } from '@syn/directives';
import { DropdownOption } from '@syn/models';
import { GetFilteredDropdownOptionsPipe } from '@syn/pipes';
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
export class SynSingleSelectComponent implements OnInit {
  @ViewChild(MatMenuTrigger) protected dropdownTrigger: MatMenuTrigger;

  public options = input.required<DropdownOption[]>();
  public selectedOption = input.required<DropdownOption | null>();

  public optionSelected = output<DropdownOption>();

  protected isLabelTooltipVisible: boolean = false;
  protected isListItemTooltipVisible: boolean = false;
  protected filterForm: FormGroup<{ filterText: FormControl<string> }>;
  protected debouncedFilterText: string;

  ngOnInit(): void {
    this.filterForm = new FormGroup({
      filterText: new FormControl<string>(''),
    });

    this.filterForm.valueChanges.pipe(debounceTime(100)).subscribe((value) => {
      this.debouncedFilterText = value.filterText;
    });
  }

  protected onOptionSelect(option: DropdownOption): void {
    this.optionSelected.emit(option);
  }
}

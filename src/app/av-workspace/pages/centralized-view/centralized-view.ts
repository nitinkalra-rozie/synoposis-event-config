import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SynMenuMultiSelect } from 'src/app/shared/components/syn-menu-multi-select/syn-menu-multi-select';
import { SynMenuMultiSelectOption } from 'src/app/shared/components/syn-menu-multi-select/syn-menu-multi-select-option.model';
import { SynSearchInput } from 'src/app/shared/components/syn-search-input/syn-search-input';

@Component({
  selector: 'app-centralized-view',
  templateUrl: './centralized-view.html',
  styleUrl: './centralized-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    SynSearchInput,
    SynMenuMultiSelect,
  ],
})
export class CentralizedView {
  protected isLoading = signal(false);
  protected productSearchTerm = signal('');

  protected onSearch(value: string): void {
    console.log(value);
  }

  protected executeSearch(value: string): void {
    console.log(value);
  }

  protected onSelectionsApplied(
    selections: SynMenuMultiSelectOption<string>[] | string[]
  ): void {
    console.log('onSelectionsApplied', selections);
  }
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SynMultiSelect } from 'src/app/shared/components/syn-multi-select/syn-multi-select';
import { SynSearchInput } from '../../../shared/components/syn-search-input/syn-search-input';

@Component({
  selector: 'app-centralized-view',
  templateUrl: './centralized-view.html',
  styleUrl: './centralized-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    SynMultiSelect,
    SynSearchInput,
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
}

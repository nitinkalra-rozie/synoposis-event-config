import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SynMenuMultiSelect } from 'src/app/shared/components/syn-menu-multi-select/syn-menu-multi-select';
import { SynMenuMultiSelectOption } from 'src/app/shared/components/syn-menu-multi-select/syn-menu-multi-select-option.model';
import { SynSearchInput } from 'src/app/shared/components/syn-search-input/syn-search-input';

@Component({
  selector: 'app-stage-info-header',
  templateUrl: './stage-info-header.html',
  styleUrl: './stage-info-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIconModule, SynSearchInput, SynMenuMultiSelect],
})
export class StageInfoHeader {
  public readonly searchTerm = input.required<string>();
  public readonly locations = input.required<string[]>();
  public readonly showFilter = input<boolean>(true);

  public readonly searchChange = output<string>();
  public readonly filterChange = output<
    string[] | SynMenuMultiSelectOption<string>[]
  >();
}

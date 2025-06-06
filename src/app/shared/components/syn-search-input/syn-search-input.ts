import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'syn-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './syn-search-input.html',
  styleUrl: './syn-search-input.scss',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
})
export class SynSearchInput {
  public readonly type = input<string>('text');
  public readonly placeholder = input<string>('Search');
  public readonly searchIcon = input<string>('search');
  public readonly disabled = input<boolean>(false);
  public readonly appearance = input<'fill' | 'outline'>('fill');

  public readonly searchValue = model<string>('');

  public readonly searchChange = output<string>();
  public readonly enterPressed = output<string>();
  public readonly focusEvent = output<void>();
  public readonly blurEvent = output<void>();

  protected onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.searchChange.emit(value);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.enterPressed.emit(this.searchValue());
    }
  }

  protected onFocus(): void {
    this.focusEvent.emit();
  }

  protected onBlur(): void {
    this.blurEvent.emit();
  }
}

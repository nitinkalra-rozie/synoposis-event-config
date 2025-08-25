import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'syn-search-input',
  templateUrl: './syn-search-input.html',
  styleUrl: './syn-search-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class SynSearchInput {
  public readonly type = input<string>('text');
  public readonly placeholder = input<string>('Search');
  public readonly searchIcon = input<string>('search');
  public readonly disabled = input<boolean>(false);
  public readonly appearance = input<'fill' | 'outline'>('fill');
  public readonly filteredCount = input<number>(0);
  public readonly totalCount = input<number>(0);

  public readonly searchChange = output<string>();
  public readonly enterPressed = output<string>();
  public readonly focusEvent = output<void>();
  public readonly blurEvent = output<void>();

  public readonly searchValue = model<string>('');

  protected showClearButton = computed(
    () => this.searchValue().trim().length > 0
  );

  protected countText = computed(
    () => `${this.filteredCount()} out of ${this.totalCount()}`
  );

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

  protected onClear(): void {
    this.searchValue.set('');
    this.searchChange.emit('');
  }
}

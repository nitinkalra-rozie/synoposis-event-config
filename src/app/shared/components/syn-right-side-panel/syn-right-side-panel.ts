import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'syn-right-side-panel',
  templateUrl: './syn-right-side-panel.html',
  styleUrl: './syn-right-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class SynRightSidePanel {
  public readonly isOpen = input.required<boolean>();
  public readonly title = input.required<string>();
  public readonly width = input<string>('26rem');
  public readonly panelClass = input<string>('');

  public readonly panelClose = output<void>();
}

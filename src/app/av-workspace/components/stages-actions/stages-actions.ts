import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stages-actions',
  templateUrl: './stages-actions.html',
  styleUrl: './stages-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class StagesActions {
  public readonly isStartListeningEnabled = input.required<boolean>();
  public readonly isPauseListeningEnabled = input.required<boolean>();
  public readonly isStopListeningEnabled = input.required<boolean>();
  public readonly selectedCount = input<number>(0);

  public readonly startListening = output<void>();
  public readonly pauseListening = output<void>();
  public readonly stopListening = output<void>();

  protected onStartListening(): void {
    if (this.isStartListeningEnabled()) {
      this.startListening.emit();
    }
  }

  protected onPauseListening(): void {
    if (this.isPauseListeningEnabled()) {
      this.pauseListening.emit();
    }
  }

  protected onStopListening(): void {
    if (this.isStopListeningEnabled()) {
      this.stopListening.emit();
    }
  }
}

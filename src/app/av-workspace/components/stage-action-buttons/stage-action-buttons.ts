import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { StageActionButtonState } from 'src/app/av-workspace/models/stage-action-button-state.model';

@Component({
  selector: 'app-stage-action-buttons',
  templateUrl: './stage-action-buttons.html',
  styleUrl: './stage-action-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class StageActionButtons {
  public readonly stage = input.required<EventStage>();

  public readonly startListening = output<string>();
  public readonly pauseListening = output<string>();
  public readonly stopListening = output<string>();

  protected readonly buttonStates = computed(() => {
    const stage = this.stage();
    return this._calculateButtonState(stage);
  });

  protected onStartListening(): void {
    this.startListening.emit(this.stage().stage);
  }

  protected onPauseListening(): void {
    this.pauseListening.emit(this.stage().stage);
  }

  protected onStopListening(): void {
    this.stopListening.emit(this.stage().stage);
  }

  private _calculateButtonState(entity: EventStage): StageActionButtonState {
    const isOffline = entity.status === 'OFFLINE';
    const hasNoSession = !entity.currentSessionId;
    const currentAction = entity.currentAction;

    return {
      canStart: this._canStartListening(isOffline, hasNoSession, currentAction),
      canPause: this._canPauseListening(isOffline, hasNoSession, currentAction),
      canStop: this._canStopListening(isOffline, hasNoSession, currentAction),
    };
  }

  private _canStartListening(
    isOffline: boolean,
    hasNoSession: boolean,
    currentAction: string | null
  ): boolean {
    return (
      !isOffline &&
      !hasNoSession &&
      currentAction !== 'SESSION_LIVE_LISTENING' &&
      currentAction !== 'SESSION_END'
    );
  }

  private _canPauseListening(
    isOffline: boolean,
    hasNoSession: boolean,
    currentAction: string | null
  ): boolean {
    return (
      !isOffline && !hasNoSession && currentAction === 'SESSION_LIVE_LISTENING'
    );
  }

  private _canStopListening(
    isOffline: boolean,
    hasNoSession: boolean,
    currentAction: string | null
  ): boolean {
    return (
      !isOffline &&
      !hasNoSession &&
      currentAction &&
      currentAction !== 'SESSION_LIVE_LISTENING_PAUSED' &&
      currentAction !== 'SESSION_END'
    );
  }
}

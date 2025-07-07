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

  protected onStartPauseResume(): void {
    const action = this.buttonStates().startPauseResumeButton.action;
    const stageId = this.stage().stage;

    switch (action) {
      case 'start':
      case 'resume':
        this.startListening.emit(stageId);
        break;
      case 'pause':
        this.pauseListening.emit(stageId);
        break;
    }
  }

  protected onStopListening(): void {
    this.stopListening.emit(this.stage().stage);
  }

  private _calculateButtonState(entity: EventStage): StageActionButtonState {
    const isOffline = entity.status === 'OFFLINE';
    const hasNoSession = !entity.currentSessionId;
    const currentAction = entity.currentAction;

    return {
      canStop: this._canStopListening(isOffline, hasNoSession, currentAction),
      startPauseResumeButton: this._calculateStartPauseResumeButtonState(
        isOffline,
        hasNoSession,
        currentAction
      ),
    };
  }

  private _calculateStartPauseResumeButtonState(
    isOffline: boolean,
    hasNoSession: boolean,
    currentAction: string | null
  ): StageActionButtonState['startPauseResumeButton'] {
    if (isOffline || hasNoSession) {
      return {
        isEnabled: false,
        action: 'start',
        icon: 'syn:mic_outlined',
      };
    }

    switch (currentAction) {
      case 'SESSION_LIVE_LISTENING':
        return {
          isEnabled: true,
          action: 'pause',
          icon: 'pause',
        };

      case 'SESSION_LIVE_LISTENING_PAUSED':
        return {
          isEnabled: true,
          action: 'resume',
          icon: 'syn:mic_outlined',
        };

      case 'SESSION_END':
        return {
          isEnabled: false,
          action: 'start',
          icon: 'syn:mic_outlined',
        };

      default:
        return {
          isEnabled: true,
          action: 'start',
          icon: 'syn:mic_outlined',
        };
    }
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

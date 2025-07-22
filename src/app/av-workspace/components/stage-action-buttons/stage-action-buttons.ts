import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { StageActionButtonState } from 'src/app/av-workspace/models/stage-action-button-state.model';

@Component({
  selector: 'app-stage-action-buttons',
  templateUrl: './stage-action-buttons.html',
  styleUrl: './stage-action-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
})
export class StageActionButtons {
  public readonly stage = input.required<EventStage>();
  public readonly isStartPauseResumeActionLoading = input.required<boolean>();
  public readonly isMultipleSelectionActive = input.required<boolean>();
  public readonly isAutoAvEnabled = input.required<boolean>();

  public readonly startListening = output<string>();
  public readonly pauseListening = output<string>();
  public readonly stopListening = output<string>();
  public readonly toggleAutoAv = output<boolean>();

  protected readonly buttonStates = computed(() => {
    const stage = this.stage();
    const isLoading = this.isStartPauseResumeActionLoading();
    return this._calculateButtonState(stage, isLoading);
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

  protected onToggleChange(event: MatSlideToggleChange): void {
    event.source.checked = this.isAutoAvEnabled();
    this.toggleAutoAv.emit(event.checked);
  }

  private _calculateButtonState(
    entity: EventStage,
    isLoading: boolean
  ): StageActionButtonState {
    const isOffline = entity.status === 'OFFLINE';
    const hasNoSession = !entity.currentSessionId;
    const currentAction = entity.currentAction;

    return {
      canToggleAutoAv: !isOffline,
      canStop: this._canStopListening(isOffline, hasNoSession, currentAction),
      startPauseResumeButton: this._calculateStartPauseResumeButtonState(
        isOffline,
        hasNoSession,
        currentAction,
        isLoading
      ),
    };
  }

  private _calculateStartPauseResumeButtonState(
    isOffline: boolean,
    hasNoSession: boolean,
    currentAction: string | null,
    isLoading: boolean
  ): StageActionButtonState['startPauseResumeButton'] {
    if (isLoading) {
      return {
        isEnabled: true,
        isLoading: true,
        action: this._getCurrentAction(currentAction),
        icon: 'syn:loading_spinner',
      };
    }

    if (isOffline || hasNoSession) {
      return {
        isEnabled: false,
        isLoading: false,
        action: 'start',
        icon: 'syn:mic_outlined',
      };
    }

    switch (currentAction) {
      case 'SESSION_LIVE_LISTENING':
        return {
          isEnabled: true,
          isLoading: false,
          action: 'pause',
          icon: 'pause',
        };

      case 'SESSION_LIVE_LISTENING_PAUSED':
        return {
          isEnabled: true,
          isLoading: false,
          action: 'resume',
          icon: 'syn:mic_outlined',
        };

      case 'SESSION_END':
        return {
          isEnabled: false,
          isLoading: false,
          action: 'start',
          icon: 'syn:mic_outlined',
        };

      default:
        return {
          isEnabled: true,
          isLoading: false,
          action: 'start',
          icon: 'syn:mic_outlined',
        };
    }
  }

  private _getCurrentAction(
    currentAction: string | null
  ): 'start' | 'pause' | 'resume' {
    switch (currentAction) {
      case 'SESSION_LIVE_LISTENING':
        return 'pause';
      case 'SESSION_LIVE_LISTENING_PAUSED':
        return 'resume';
      default:
        return 'start';
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

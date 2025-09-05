import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { STAGE_VIEW_DIALOG_MESSAGES } from 'src/app/av-workspace/constants/stage-view-interaction-messages';
import { CanStageViewComponentDeactivate } from 'src/app/av-workspace/models/can-stage-view-component-deactivate.model';
import {
  StageViewSessionRequest,
  StageViewSessionResult,
  StageViewSessionState,
} from 'src/app/av-workspace/models/stage-view-session.model';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { StageViewLegacyOperationsFacade } from 'src/app/legacy-admin/@facade/stage-view-legacy-operation-facade';

// TODO: @later remove this once the stage view is no more from legacy.
//The point is - the new stage view should be architected in a manner to handle these operations from the stage view controller layer (conceptually)
@Injectable({ providedIn: 'root' })
export class StageViewDeactivationService {
  private readonly _stageViewLegacyOperationsFacade = inject(
    StageViewLegacyOperationsFacade
  );

  getSessionState(): StageViewSessionState {
    const sessionInfo =
      this._stageViewLegacyOperationsFacade.getSessionStateInfo();
    return this._mapLegacyStateToStageViewState(sessionInfo.sessionState);
  }

  cleanupNavigationState(): void {
    this._stageViewLegacyOperationsFacade.disconnectStageWebSockets();
    this._stageViewLegacyOperationsFacade.pauseSessionState();
  }

  buildDeactivationRequest(
    isLeavingStageView: boolean
  ): StageViewSessionRequest {
    return {
      isLeavingStageView,
      isSessionActive: this.getSessionState() === StageViewSessionState.Playing,
    };
  }

  getDeactivationDialogConfig(
    request: StageViewSessionRequest
  ): StageViewSessionResult {
    if (!request.isLeavingStageView || !request.isSessionActive) {
      return { canDeactivate: true, requiresConfirmation: false };
    }

    const { MESSAGE, TITLE, CONFIRM_BUTTON_TEXT, CANCEL_BUTTON_TEXT } =
      STAGE_VIEW_DIALOG_MESSAGES.LEAVE_STAGE_VIEW;

    return {
      canDeactivate: false,
      requiresConfirmation: true,
      dialogMessage: MESSAGE.WITH_ACTIVE_SESSION,
      dialogTitle: TITLE,
      confirmButtonText: CONFIRM_BUTTON_TEXT,
      cancelButtonText: CANCEL_BUTTON_TEXT,
    };
  }

  executeDeactivation(
    isConfirmed: boolean,
    request: StageViewSessionRequest,
    component: CanStageViewComponentDeactivate,
    router: Router
  ): Observable<boolean> {
    if (!isConfirmed) {
      return of(false);
    }

    return this._performDeactivationOperations(request, component);
  }

  private _performDeactivationOperations(
    request: StageViewSessionRequest,
    component: CanStageViewComponentDeactivate
  ): Observable<boolean> {
    this._stageViewLegacyOperationsFacade.disconnectStageWebSockets();

    if (!request.isSessionActive) return of(true);

    this._pauseCurrentSession(component);
    return this._stageViewLegacyOperationsFacade.pauseSessionViaAPI();
  }

  private _pauseCurrentSession(
    component: CanStageViewComponentDeactivate
  ): void {
    this._stageViewLegacyOperationsFacade.pauseSessionState();
    component.pauseCurrentSession?.();
  }

  private _mapLegacyStateToStageViewState(
    legacyState: LiveSessionState
  ): StageViewSessionState {
    switch (legacyState) {
      case LiveSessionState.Playing:
        return StageViewSessionState.Playing;
      case LiveSessionState.Paused:
        return StageViewSessionState.Paused;
      default:
        return StageViewSessionState.Stopped;
    }
  }
}

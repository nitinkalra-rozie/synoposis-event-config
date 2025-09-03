import { inject, Injectable } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STAGE_VIEW_DIALOG_MESSAGES } from 'src/app/av-workspace/constants/stage-view-interaction-messages';
import {
  AVWorkspaceDeactivationRequest,
  AVWorkspaceDeactivationResult,
  AVWorkspaceSessionState,
} from 'src/app/av-workspace/models/av-workspace-session.model';
import { CanStageViewComponentDeactivate } from 'src/app/av-workspace/models/can-stage-view-component-deactivate.model';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { StageViewLegacyOperationsFacade } from 'src/app/legacy-admin/@facade/stage-view-legacy-operation-facade';

@Injectable({ providedIn: 'root' })
export class StageViewDeactivationService {
  private readonly _stageViewLegacyOperationsFacade = inject(
    StageViewLegacyOperationsFacade
  );

  getSessionState(): AVWorkspaceSessionState {
    const sessionInfo =
      this._stageViewLegacyOperationsFacade.getSessionStateInfo();
    return this._mapLegacyStateToAVWorkspaceState(sessionInfo.sessionState);
  }

  cleanupNavigationState(): void {
    this.getSessionState();
  }

  buildDeactivationRequest(
    isLeavingStageView: boolean,
    nextState?: RouterStateSnapshot
  ): AVWorkspaceDeactivationRequest {
    return {
      isLeavingStageView,
      isSessionActive:
        this.getSessionState() === AVWorkspaceSessionState.Playing,
      isSwitchingToCentralized:
        nextState?.url?.includes('/centralized') ?? false,
    };
  }

  getDeactivationDialogConfig(
    request: AVWorkspaceDeactivationRequest
  ): AVWorkspaceDeactivationResult {
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
    request: AVWorkspaceDeactivationRequest,
    component: CanStageViewComponentDeactivate,
    router: Router
  ): Observable<boolean> {
    if (!isConfirmed) {
      return of(false);
    }

    return this._performDeactivationOperations(request, component).pipe(
      catchError(() => of(false))
    );
  }

  private _performDeactivationOperations(
    request: AVWorkspaceDeactivationRequest,
    component: CanStageViewComponentDeactivate
  ): Observable<boolean> {
    this._stageViewLegacyOperationsFacade.disconnectStageWebSockets();

    if (!request.isSessionActive) return of(true);

    this._pauseCurrentSession(component);
    return this._stageViewLegacyOperationsFacade
      .pauseSessionViaAPI()
      .pipe(catchError(() => of(false)));
  }

  private _pauseCurrentSession(
    component: CanStageViewComponentDeactivate
  ): void {
    this._stageViewLegacyOperationsFacade.pauseSessionState();
    component.pauseCurrentSession?.();
  }

  private _mapLegacyStateToAVWorkspaceState(
    legacyState: LiveSessionState
  ): AVWorkspaceSessionState {
    switch (legacyState) {
      case LiveSessionState.Playing:
        return AVWorkspaceSessionState.Playing;
      case LiveSessionState.Paused:
        return AVWorkspaceSessionState.Paused;
      default:
        return AVWorkspaceSessionState.Stopped;
    }
  }
}

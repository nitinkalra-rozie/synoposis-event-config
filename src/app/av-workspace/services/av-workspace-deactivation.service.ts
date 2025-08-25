import { inject, Injectable } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STAGE_VIEW_DIALOG_MESSAGES } from 'src/app/av-workspace/constants/stage-view-interaction-messages';
import { CentralizedViewTranscriptWebSocketFacade } from 'src/app/av-workspace/facade/centralized-view-transcript-websocket-facade';
import { CentralizedViewWebSocketFacade } from 'src/app/av-workspace/facade/centralized-view-websocket-facade';
import { CanDeactivateComponent } from 'src/app/av-workspace/guards/can-deactivate-component.interface';
import {
  AVWorkspaceDeactivationRequest,
  AVWorkspaceDeactivationResult,
  AVWorkspaceSessionState,
} from 'src/app/av-workspace/models/av-workspace-session.model';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { AvWorkspaceLegacyOperationsService } from 'src/app/legacy-admin/@services/av-workspace-legacy-operations.service';

@Injectable({
  providedIn: 'root',
})
export class AVWorkspaceDeactivationService {
  private readonly _legacyOperations = inject(
    AvWorkspaceLegacyOperationsService
  );
  private readonly _centralizedViewWebSocketFacade = inject(
    CentralizedViewWebSocketFacade
  );
  private readonly _centralizedViewTranscriptFacade = inject(
    CentralizedViewTranscriptWebSocketFacade
  );

  getSessionState(): AVWorkspaceSessionState {
    const sessionInfo = this._legacyOperations.getSessionStateInfo();
    return this._mapLegacyStateToAVWorkspaceState(sessionInfo.sessionState);
  }

  buildDeactivationRequest(
    isLeavingStageView: boolean,
    nextState?: RouterStateSnapshot
  ): AVWorkspaceDeactivationRequest {
    const isSessionActive =
      this.getSessionState() === AVWorkspaceSessionState.Playing;
    const destinationName = this._getDestinationName(nextState);
    const isSwitchingToCentralized =
      nextState?.url?.includes('centralized') ?? false;

    return {
      isLeavingStageView,
      isSessionActive,
      destinationName,
      isSwitchingToCentralized,
    };
  }

  getDeactivationDialogConfig(
    request: AVWorkspaceDeactivationRequest
  ): AVWorkspaceDeactivationResult {
    if (!request.isLeavingStageView) {
      return {
        canDeactivate: true,
        requiresConfirmation: false,
      };
    }

    const dialogMessages = STAGE_VIEW_DIALOG_MESSAGES.LEAVE_STAGE_VIEW;
    const message = request.isSessionActive
      ? dialogMessages.MESSAGE.WITH_ACTIVE_SESSION(request.destinationName)
      : dialogMessages.MESSAGE.WITHOUT_ACTIVE_SESSION(request.destinationName);

    return {
      canDeactivate: false,
      requiresConfirmation: true,
      dialogMessage: message,
      dialogTitle: dialogMessages.TITLE,
      confirmButtonText: dialogMessages.CONFIRM_BUTTON_TEXT(
        request.destinationName
      ),
      cancelButtonText: dialogMessages.CANCEL_BUTTON_TEXT,
    };
  }

  executeDeactivation(
    isConfirmed: boolean,
    request: AVWorkspaceDeactivationRequest,
    component: CanDeactivateComponent,
    router: Router,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> {
    if (!isConfirmed) {
      this._handleDialogCancellation(router, nextState);
      return of(false);
    }

    return this._performDeactivationOperations(request, component).pipe(
      catchError(() => of(false))
    );
  }

  private _performDeactivationOperations(
    request: AVWorkspaceDeactivationRequest,
    component: CanDeactivateComponent
  ): Observable<boolean> {
    this._executeDisconnectOperations();

    if (request.isSessionActive && request.isSwitchingToCentralized) {
      return this._legacyOperations
        .pauseSessionViaAPI()
        .pipe(catchError(() => of(false)));
    } else if (request.isSessionActive) {
      this._pauseCurrentSession(component);
    }

    return of(true);
  }

  private _executeDisconnectOperations(): void {
    const legacyResult = this._legacyOperations.disconnectLegacyWebSockets();

    this._centralizedViewWebSocketFacade.disconnect();
    this._centralizedViewTranscriptFacade.disconnect();
  }

  private _pauseCurrentSession(component: CanDeactivateComponent): void {
    this._legacyOperations.pauseSessionState();

    if (component.pauseCurrentSession) {
      component.pauseCurrentSession();
    }
  }

  private _handleDialogCancellation(
    router: Router,
    nextState?: RouterStateSnapshot
  ): void {
    if (!router.url.includes('/stage')) {
      router.navigate(['/av-workspace/stage'], { replaceUrl: true });
    }

    window.dispatchEvent(
      new CustomEvent('stage-view-dialog-cancelled', {
        detail: {
          stayInStage: true,
          attemptedDestination: this._getDestinationName(nextState),
          currentUrl: router.url,
        },
      })
    );
  }

  private _getDestinationName(nextState?: RouterStateSnapshot): string {
    if (!nextState?.url) return 'another view';
    return nextState.url.includes('centralized')
      ? 'Centralized View'
      : 'another view';
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

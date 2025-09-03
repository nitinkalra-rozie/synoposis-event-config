import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanDeactivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CanStageViewComponentDeactivate } from 'src/app/av-workspace/models/can-stage-view-component-deactivate.model';

import { StageViewDeactivationService } from 'src/app/av-workspace/services/stage-view-deactivation.service';
import { SynConfirmDialogFacade } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog-facade';

export const canDeactivateStageViewGuard: CanDeactivateFn<
  CanStageViewComponentDeactivate
> = (
  component: CanStageViewComponentDeactivate,
  currentRoute: ActivatedRouteSnapshot,
  _currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot
): Observable<boolean> | boolean => {
  const router = inject(Router);
  const confirmDialog = inject(SynConfirmDialogFacade);
  const deactivationService = inject(StageViewDeactivationService);

  const isStageRoute = currentRoute.routeConfig?.path === 'stage';

  if (!isStageRoute) {
    return component.canDeactivate?.() ?? true;
  }

  deactivationService.cleanupNavigationState();

  const request = deactivationService.buildDeactivationRequest(true, nextState);
  const {
    canDeactivate,
    requiresConfirmation,
    dialogTitle,
    dialogMessage,
    confirmButtonText,
    cancelButtonText,
  } = deactivationService.getDeactivationDialogConfig(request);

  if (!requiresConfirmation) return canDeactivate;

  return confirmDialog
    .openConfirmDialog({
      title: dialogTitle!,
      message: dialogMessage!,
      confirmButtonText: confirmButtonText!,
      cancelButtonText: cancelButtonText!,
    })
    .pipe(
      switchMap((isConfirmed: boolean | undefined) =>
        deactivationService.executeDeactivation(
          isConfirmed === true,
          request,
          component,
          router
        )
      )
    );
};

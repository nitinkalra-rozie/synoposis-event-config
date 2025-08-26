import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanDeactivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CanDeactivateComponent } from 'src/app/av-workspace/guards/can-deactivate-component.interface';
import { AVWorkspaceDeactivationService } from 'src/app/av-workspace/services/av-workspace-deactivation.service';
import { SynConfirmDialogFacade } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog-facade';

export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = (
  component: CanDeactivateComponent,
  currentRoute: ActivatedRouteSnapshot,
  _currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot
): Observable<boolean> | boolean => {
  const router = inject(Router);
  const confirmDialog = inject(SynConfirmDialogFacade);
  const deactivationService = inject(AVWorkspaceDeactivationService);

  const isLeavingStageView = currentRoute.routeConfig?.path === 'stage';

  if (!isLeavingStageView) {
    return component.canDeactivate ? component.canDeactivate() : true;
  }

  deactivationService.cleanupNavigationState();

  const request = deactivationService.buildDeactivationRequest(
    isLeavingStageView,
    nextState
  );
  const dialogConfig = deactivationService.getDeactivationDialogConfig(request);

  if (!dialogConfig.requiresConfirmation) {
    return dialogConfig.canDeactivate;
  }

  return confirmDialog
    .openConfirmDialog({
      title: dialogConfig.dialogTitle!,
      message: dialogConfig.dialogMessage!,
      confirmButtonText: dialogConfig.confirmButtonText!,
      cancelButtonText: dialogConfig.cancelButtonText!,
    })
    .pipe(
      switchMap((isConfirmed: boolean | undefined) => {
        if (isConfirmed === true) {
          return deactivationService.executeDeactivation(
            true,
            request,
            component,
            router,
            nextState
          );
        }

        return deactivationService.executeDeactivation(
          false,
          request,
          component,
          router,
          nextState
        );
      })
    );
};

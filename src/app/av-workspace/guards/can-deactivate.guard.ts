import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanDeactivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CentralizedViewStagesDataService } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages-data-service';
import { CanDeactivateComponent } from 'src/app/av-workspace/guards/can-deactivate-component.interface';
import { EventConfigStore } from 'src/app/core/stores/event-config-store';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { SynConfirmDialogFacade } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog-facade';
import {
  callPauseSessionAPI,
  getDestinationName,
  handleDialogCancellation,
  pauseCurrentSessionLocally,
} from '../utils/can-deactivate-guard.utils';

export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = (
  component: CanDeactivateComponent,
  currentRoute: ActivatedRouteSnapshot,
  _currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot
): Observable<boolean> | boolean => {
  const router = inject(Router);
  const confirmDialog = inject(SynConfirmDialogFacade);
  const dashboardService = inject(DashboardFiltersStateService);
  const eventConfigStore = inject(EventConfigStore);
  const stagesDataService = inject(CentralizedViewStagesDataService);

  const isLeavingStageView = currentRoute.routeConfig?.path === 'stage';

  if (!isLeavingStageView) {
    return component.canDeactivate ? component.canDeactivate() : true;
  }

  const isSessionActive =
    dashboardService.liveEventState() === LiveSessionState.Playing;
  const destinationName = getDestinationName(nextState);
  const isSwitchingToCentralized =
    nextState?.url?.includes('centralized') ?? false;

  const message = isSessionActive
    ? `You are currently managing an active session. Switching to ${destinationName} will pause your session. Continue?`
    : `Are you sure you want to switch to ${destinationName}?`;

  return confirmDialog
    .openConfirmDialog({
      title: 'Leave Stage View?',
      message,
      confirmButtonText: `Switch to ${destinationName}`,
      cancelButtonText: 'Stay in Stage View',
    })
    .pipe(
      switchMap((confirmed: boolean | undefined) => {
        if (!confirmed) {
          handleDialogCancellation(router, nextState);
          return of(false);
        }

        if (isSessionActive && isSwitchingToCentralized) {
          return callPauseSessionAPI(
            dashboardService,
            eventConfigStore,
            stagesDataService
          ).pipe(
            switchMap((apiSuccess) => of(apiSuccess)),
            catchError(() => of(false))
          );
        }

        if (isSessionActive) {
          pauseCurrentSessionLocally(component, dashboardService);
        }

        return of(true);
      }),
      catchError(() => of(false))
    );
};

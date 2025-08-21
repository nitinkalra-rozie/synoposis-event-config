import { Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { EventConfigStore } from '../../core/stores/event-config-store';
import { LiveSessionState } from '../../legacy-admin/@data-services/event-details/event-details.data-model';
import { DashboardFiltersStateService } from '../../legacy-admin/@services/dashboard-filters-state.service';
import { CentralizedViewStagesDataService } from '../data-services/centralized-view-stages/centralized-view-stages-data-service';
import { StageSessionActionRequestData } from '../data-services/centralized-view-stages/centralized-view-stages.data-model';
import { CanDeactivateComponent } from '../guards/can-deactivate-component.interface';

export function getDestinationName(nextState?: RouterStateSnapshot): string {
  if (!nextState?.url) return 'another view';
  return nextState.url.includes('centralized')
    ? 'Centralized View'
    : 'another view';
}

export function callPauseSessionAPI(
  dashboardService: DashboardFiltersStateService,
  eventConfigStore: EventConfigStore,
  stagesDataService: CentralizedViewStagesDataService
): Observable<boolean> {
  const eventIdentifier = eventConfigStore.$eventIdentifier();
  if (!eventIdentifier) {
    return of(false);
  }

  const currentStage = localStorage.getItem('currentStage');
  const currentSessionId = localStorage.getItem('currentSessionId');

  if (!currentStage || !currentSessionId) {
    return of(false);
  }

  const requestData: StageSessionActionRequestData = {
    action: 'adminPauseListening',
    eventName: eventIdentifier,
    processStages: [{ stage: currentStage, sessionId: currentSessionId }],
  };

  return stagesDataService.pauseListeningSession(requestData).pipe(
    switchMap((response) => {
      if (response.success) {
        dashboardService.setLiveSessionState(LiveSessionState.Paused);
      }
      return of(response.success);
    }),
    catchError(() => of(false))
  );
}

export function pauseCurrentSessionLocally(
  component: CanDeactivateComponent,
  dashboardService: DashboardFiltersStateService
): void {
  dashboardService.setLiveSessionState(LiveSessionState.Paused);

  if (component.pauseCurrentSession) {
    component.pauseCurrentSession();
  }
}

export function handleDialogCancellation(
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
        attemptedDestination: getDestinationName(nextState),
        currentUrl: router.url,
      },
    })
  );
}

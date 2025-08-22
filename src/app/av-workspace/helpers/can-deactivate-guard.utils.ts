import { Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CanDeactivateComponent } from 'src/app/av-workspace/guards/can-deactivate-component.interface';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { PostData } from 'src/app/legacy-admin/shared/types';

export function getDestinationName(nextState?: RouterStateSnapshot): string {
  if (!nextState?.url) return 'another view';
  return nextState.url.includes('centralized')
    ? 'Centralized View'
    : 'another view';
}

export function callPauseSessionAPI(
  dashboardService: DashboardFiltersStateService,
  backendApiService: LegacyBackendApiService
): Observable<boolean> {
  const currentStage = localStorage.getItem('currentStage');
  const currentSessionId = localStorage.getItem('currentSessionId');
  const selectedEvent = localStorage.getItem('selectedEvent');
  const domain = localStorage.getItem('domain');
  const currentDay = localStorage.getItem('currentDay');
  const currentSessionTitle = localStorage.getItem('currentSessionTitle');

  if (!currentStage || !currentSessionId || !selectedEvent || !domain) {
    return of(false);
  }

  const postData: PostData = {
    action: 'listeningPaused',
    sessionId: currentSessionId,
    eventName: selectedEvent,
    domain: domain,
    day: currentDay,
    stage: currentStage,
    sessionTitle: currentSessionTitle,
  };

  return backendApiService.postData(postData).pipe(
    switchMap((response) => {
      if (response) {
        dashboardService.setLiveSessionState(LiveSessionState.Paused);
        return of(true);
      }
      return of(false);
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

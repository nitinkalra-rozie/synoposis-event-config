import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { map, Observable } from 'rxjs';
import { AvWorkspaceView } from 'src/app/av-workspace/models/av-workspace-view.model';
import { getAvWorkspaceAccess } from 'src/app/av-workspace/utils/av-workspace-permissions';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';

export const avWorkspaceGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  return authFacade.getUserGroups$().pipe(
    map((groups) => {
      const access = getAvWorkspaceAccess(groups);
      const requestedRoute = route.routeConfig?.path as AvWorkspaceView;

      if (access.availableViews.includes(requestedRoute)) {
        return true;
      }

      // TODO:@later: We should redirect to the not found page if it's for an unavailable route.
      // TODO:@later: We should redirect to the unauthorized page if the user has no access to any AV workspace views.
      if (access.defaultView) {
        return router.createUrlTree(['/av-workspace', access.defaultView]);
      }

      return router.createUrlTree(['/unauthorized']);
    })
  );
};

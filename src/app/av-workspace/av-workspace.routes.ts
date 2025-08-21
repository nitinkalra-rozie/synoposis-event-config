import { Route } from '@angular/router';
import { canDeactivateGuard } from 'src/app/av-workspace/guards/can-deactivate.guard';
import { authGuard } from 'src/app/core/auth/guards/auth-guard';

export const avWorkspaceRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('src/app/av-workspace/av-workspace').then((c) => c.AvWorkspace),
    title: 'Rozie Synopsis - AV Workspace',
    children: [
      {
        path: 'centralized',
        loadComponent: () =>
          import(
            'src/app/av-workspace/pages/centralized-view/centralized-view'
          ).then((c) => c.CentralizedView),
        canActivate: [authGuard],
      },
      {
        path: 'stage',
        loadComponent: () =>
          import('src/app/av-workspace/pages/stage-view/stage-view').then(
            (c) => c.StageView
          ),
        canActivate: [authGuard],
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: '',
        redirectTo: 'centralized',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'centralized',
  },
];

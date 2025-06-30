import { Route } from '@angular/router';
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

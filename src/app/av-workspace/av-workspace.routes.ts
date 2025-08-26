import { Route } from '@angular/router';
import { avWorkspaceGuard } from 'src/app/av-workspace/guards/av-workspace-guard';

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
        canActivate: [avWorkspaceGuard],
      },
      {
        path: 'stage',
        loadComponent: () =>
          import('src/app/av-workspace/pages/stage-view/stage-view').then(
            (c) => c.StageView
          ),
        canActivate: [avWorkspaceGuard],
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

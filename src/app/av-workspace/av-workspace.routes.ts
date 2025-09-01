import { Route } from '@angular/router';
import { avWorkspaceGuard } from 'src/app/av-workspace/guards/av-workspace-guard';
import { stageViewGuard } from 'src/app/av-workspace/guards/stage-view.guard';

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
        canDeactivate: [stageViewGuard],
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

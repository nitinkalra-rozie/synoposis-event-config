import { Route } from '@angular/router';

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
      },
      {
        path: 'stage',
        loadComponent: () =>
          import('src/app/av-workspace/pages/stage-view/stage-view').then(
            (c) => c.StageView
          ),
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

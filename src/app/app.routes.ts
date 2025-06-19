import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/auth/guards/auth-guard';
import { loginRedirectGuard } from 'src/app/core/auth/guards/login-redirect-guard';
// import { loginRedirectGuard } from 'src/app/core/auth/guards/login-redirect.guard';
import { ROUTE_PERMISSIONS } from 'src/app/core/config/permission-config';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'stream',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/audio-streamer/audio-streamer.component'
      ).then((c) => c.AudioStreamerComponent),
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('src/app/legacy-admin/components/otp/otp.component').then(
        (c) => c.OtpComponent
      ),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'av-workspace',
    loadChildren: () =>
      import('src/app/av-workspace/av-workspace.routes').then(
        (r) => r.avWorkspaceRoutes
      ),
    canActivate: [authGuard],
    data: { roles: ROUTE_PERMISSIONS.avWorkspace },
  },
  {
    path: 'insights-editor',
    loadChildren: () =>
      import('./insights-editor/insights-editor.routes').then(
        (r) => r.insightsEditorRoutes
      ),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.editor,
    },
  },
  {
    path: 'content-editor',
    loadChildren: () =>
      import('src/app/content-editor/content-editor.routes').then(
        (r) => r.contentEditorRoutes
      ),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.editor,
    },
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('src/app/legacy-admin/@pages/agenda/agenda.component').then(
        (c) => c.AgendaComponent
      ),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.eventOrganizer,
    },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/@pages/analytics-dashboard/analytics-dashboard.component'
      ).then((c) => c.AnalyticsDashboardComponent),
    canActivate: [authGuard],
    data: {
      roles: ROUTE_PERMISSIONS.eventOrganizer,
    },
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('src/app/shared/pages/unauthorized/unauthorized').then(
        (c) => c.Unauthorized
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
  },
];

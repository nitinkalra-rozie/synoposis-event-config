import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/auth/guards/auth-guard';
import { AnalyticsDashboardComponent } from 'src/app/legacy-admin/@pages/analytics-dashboard/analytics-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
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
  },
  {
    path: 'login',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/elsa-event-admin-v2/elsa-event-admin-v2.component'
      ).then((c) => c.ElsaEventAdminV2Component),
    canActivate: [authGuard],
  },
  {
    path: 'insights-editor',
    loadChildren: () =>
      import('./insights-editor/insights-editor.routes').then(
        (r) => r.insightsEditorRoutes
      ),
    canActivate: [authGuard],
  },
  {
    path: 'content-editor',
    loadChildren: () =>
      import('src/app/content-editor/content-editor.routes').then(
        (r) => r.contentEditorRoutes
      ),
    canActivate: [authGuard],
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('src/app/legacy-admin/@pages/agenda/agenda.component').then(
        (c) => c.AgendaComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import(
        'src/app/shared/components/unauthorized/unauthorized.component'
      ).then((c) => c.UnauthorizedComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
  },
];

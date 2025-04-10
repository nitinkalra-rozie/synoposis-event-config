import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';

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
    canActivate: [AuthGuard],
  },
  {
    path: 'insights-editor',
    loadChildren: () =>
      import('./insights-editor/insights-editor.routes').then(
        (r) => r.insightsEditorRoutes
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'content-editor',
    loadChildren: () =>
      import('src/app/content-editor/content-editor.routes').then(
        (r) => r.contentEditorRoutes
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'agenda',
    loadComponent: () =>
      import('src/app/legacy-admin/@pages/agenda/agenda.component').then(
        (c) => c.AgendaComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/components/login-page/login-page.component'
      ).then((c) => c.LoginPageComponent),
  },
];

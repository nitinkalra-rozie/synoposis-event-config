import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/auth.guard';

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
    path: 'editorial',
    loadComponent: () =>
      import('src/app/legacy-admin/@pages/editorial/editorial.component').then(
        (c) => c.EditorialComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'generate-report',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/@pages/content-generate/content-generate.component'
      ).then((c) => c.ContentGenerateComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'prompt-management',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/@pages/prompt-management/prompt-management.component'
      ).then((c) => c.PromptManagementComponent),
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

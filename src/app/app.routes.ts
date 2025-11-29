import { Routes } from '@angular/router';
import { authGuard } from 'src/app/core/auth/guards/auth-guard';
import { loginRedirectGuard } from 'src/app/core/auth/guards/login-redirect-guard';

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
    path: 'event-configuration',
    loadComponent: () =>
      import(
        'src/app/legacy-admin/@pages/event-configuration/event-configuration.component'
      ).then((c) => c.EventConfigurationComponent),
    canActivate: [authGuard],
  },
  {
    path: 'report',
    loadComponent: () =>
      import('src/app/legacy-admin/@pages/report/report.component').then(
        (c) => c.ReportComponent
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

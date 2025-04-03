import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AgendaComponent } from './legacy-admin/@pages/agenda/agenda.component';
import { ContentGenerateComponent } from './legacy-admin/@pages/content-generate/content-generate.component';
import { EditorialComponent } from './legacy-admin/@pages/editorial/editorial.component';
import { PromptManagementComponent } from './legacy-admin/@pages/prompt-management/prompt-management.component';
import { AudioStreamerComponent } from './legacy-admin/components/audio-streamer/audio-streamer.component';
import { ElsaEventAdminV2Component } from './legacy-admin/components/elsa-event-admin-v2/elsa-event-admin-v2.component';
import { LoginPageComponent } from './legacy-admin/components/login-page/login-page.component';
import { OtpComponent } from './legacy-admin/components/otp/otp.component';
const routes: Routes = [
  {
    path: '',
    component: LoginPageComponent,
  },
  {
    path: 'stream',
    component: AudioStreamerComponent,
  },
  {
    path: 'otp',
    component: OtpComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'admin',
    component: ElsaEventAdminV2Component,
    canActivate: [AuthGuard],
  },
  {
    path: 'editorial',
    component: EditorialComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'generate-report',
    component: ContentGenerateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'prompt-management',
    component: PromptManagementComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'agenda',
    component: AgendaComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    component: LoginPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

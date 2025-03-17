import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
import { ElsaEventAdminV2Component } from './components/elsa-event-admin-v2/elsa-event-admin-v2.component';
import { EditorialComponent } from './@pages/editorial/editorial.component';
import { AgendaComponent } from './@pages/agenda/agenda.component';
import { ContentGenerateComponent } from './@pages/content-generate/content-generate.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { OtpComponent } from './components/otp/otp.component';
import { AuthGuard } from './auth.guard';
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

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
import { LoginComponent } from './components/login/login.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { AuthGuard } from './auth.guard'; 
import { ElsaEventAdminV2Component } from './components/elsa-event-admin-v2/elsa-event-admin-v2.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { OtpComponent } from './components/otp/otp.component';
const routes: Routes = [
    {
        path: '',
        component: LoginPageComponent
    },
    {
        path: 'stream',
        component: AudioStreamerComponent,
        canActivate: [AuthGuard] 
    },
    {
        path:'otp',
        component:OtpComponent
    },
    {
        path: 'login',
        component: LoginPageComponent
    },
    {
        path: 'newPasswordRequired',
        component: ChangePasswordComponent
    },
    {
        path: 'admin',
        component: ElsaEventAdminV2Component,
        canActivate: [AuthGuard] 
    },
    {
        path: '**',
        component: LoginComponent
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

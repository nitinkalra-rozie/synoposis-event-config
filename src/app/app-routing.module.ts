import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
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
        path: 'admin',
        component: ElsaEventAdminV2Component,
        canActivate: [AuthGuard] 
    },
    {
        path: '**',
        component: LoginPageComponent
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

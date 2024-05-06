import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
import { LoginComponent } from './components/login/login.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ElsaEventAdminComponent } from './components/elsa-event-admin/elsa-event-admin.component';
import { AuthGuard } from './auth.guard'; 
const routes: Routes = [
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'stream',
        component: AudioStreamerComponent,
        canActivate: [AuthGuard] 
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'newPasswordRequired',
        component: ChangePasswordComponent
    },
    {
        path: 'admin',
        component: ElsaEventAdminComponent,
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

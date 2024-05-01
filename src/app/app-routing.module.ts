import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
    {
        path: '',
        component: AudioStreamerComponent
    },
    {
        path: 'stream',
        component: AudioStreamerComponent
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

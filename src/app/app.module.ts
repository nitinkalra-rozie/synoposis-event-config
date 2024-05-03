import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './components/login/login.component';
import { ElsaEventAdminComponent } from './components/elsa-event-admin/elsa-event-admin.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    AppComponent,
    AudioStreamerComponent,
    LoginComponent,
    ElsaEventAdminComponent,
    ChangePasswordComponent
  ],
  imports: [
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    BrowserModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

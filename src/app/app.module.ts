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
import { CommonModule } from '@angular/common';
import { SideBarComponent } from './components/shared/side-bar/side-bar.component';
import { TopBarComponent } from './components/shared/top-bar/top-bar.component';
import { SharedModule } from './shared/shared.module';
import { ElsaEventAdminV2Component } from './components/elsa-event-admin-v2/elsa-event-admin-v2.component';
import { EventControlsComponent } from './components/event-controls/event-controls.component';
import { MainDropDownComponent } from './components/main-drop-down/main-drop-down.component';
import { TimeSelectorComponent } from './components/time-selector/time-selector.component';
import { SessionContentComponent } from './components/session-content/session-content.component';
import { ScreenDisplayComponent } from './components/screen-display/screen-display.component';
import { OutsideClickDirective } from './directives/outside-click.directive';
@NgModule({
  declarations: [
    AppComponent,
    AudioStreamerComponent,
    LoginComponent,
    ElsaEventAdminComponent,
    ChangePasswordComponent,
    SideBarComponent,
    TopBarComponent,
    ElsaEventAdminV2Component,
    EventControlsComponent,
    MainDropDownComponent,
    TimeSelectorComponent,
    SessionContentComponent,
    ScreenDisplayComponent,
    OutsideClickDirective
  ],
  imports: [
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    BrowserModule,
    SharedModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

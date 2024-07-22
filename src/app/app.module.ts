import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AudioStreamerComponent } from './components/audio-streamer/audio-streamer.component';
import { AppRoutingModule } from './app-routing.module';
import { ElsaEventAdminComponent } from './components/elsa-event-admin/elsa-event-admin.component';
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
import { TruncatePipe } from './components/main-drop-down/truncate.pipe';
import { PopUpWindowComponent } from './components/pop-up-window/pop-up-window.component';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { OtpComponent } from './components/otp/otp.component';
import { AuthApiService } from './services/auth-api.service';
import { AuthService } from './services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { FooterComponent } from './components/shared/footer/footer.component';
import { FooterMobileComponent } from './components/shared/footer-mobile/footer-mobile.component';
import { WakeLockService } from './services/wake-lock.service';
@NgModule({
  declarations: [
    AppComponent,
    AudioStreamerComponent,
    ElsaEventAdminComponent,
    SideBarComponent,
    TopBarComponent,
    ElsaEventAdminV2Component,
    EventControlsComponent,
    MainDropDownComponent,
    TimeSelectorComponent,
    SessionContentComponent,
    ScreenDisplayComponent,
    OutsideClickDirective,
    TruncatePipe,
    PopUpWindowComponent,
    LoginPageComponent,
    OtpComponent,
    FooterComponent,
    FooterMobileComponent,
  ],
  imports: [
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    BrowserModule,
    SharedModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    AuthApiService,
    AuthService,
    WakeLockService
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}

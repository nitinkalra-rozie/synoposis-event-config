import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import NoSleep from '@uriopass/nosleep.js';
import { AppComponent } from './app/app.component';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { AuthService } from './app/services/auth.service';
import { AuthApiService } from './app/services/auth-api.service';
import { AuthInterceptorService } from './app/services/auth-interceptor.service';
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
var noSleep = new NoSleep();
if (environment.production) {
  // enableProdMode();
}
if (environment.production) {
  if (window) {
      window.console.debug = window.console.error = () => { };
  }
  console.debug = console.error = () => { };
}
bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(AppRoutingModule, FormsModule, CommonModule, BrowserModule, ReactiveFormsModule),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptorService,
            multi: true,
        },
        AuthApiService,
        AuthService,
        provideHttpClient(withInterceptorsFromDi()),
    ]
})
  .catch(err => console.log(err));

var wakeLockEnabled = false;
var toggleEl = document.querySelector("#index-body");
toggleEl.addEventListener('click', function() {
  if (!wakeLockEnabled) {
    noSleep.enable();
    wakeLockEnabled = true;
  } else {
  }
}, false);
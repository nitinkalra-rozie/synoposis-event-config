import { CommonModule, IMAGE_CONFIG } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { IconsService } from '@syn/services';
import NoSleep from '@uriopass/nosleep.js';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthApiService } from './app/services/auth-api.service';
import { AuthInterceptor } from './app/@interceptors/auth.interceptor';
import { AuthService } from './app/services/auth.service';
import { environment } from './environments/environment';
const noSleep = new NoSleep();
if (environment.production) {
  // enableProdMode();
}
if (environment.production) {
  if (window) {
    window.console.debug = window.console.error = () => {};
  }
  console.debug = console.error = () => {};
}
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      AppRoutingModule,
      FormsModule,
      CommonModule,
      BrowserModule,
      ReactiveFormsModule
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    AuthApiService,
    AuthService,
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: IMAGE_CONFIG,
      useValue: {
        disableImageSizeWarning: true,
        disableImageLazyLoadWarning: true,
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      multi: true,
      deps: [IconsService],
    },
    provideAnimationsAsync(),
  ],
}).catch((err) => console.log(err));

let wakeLockEnabled = false;
const toggleEl = document.querySelector('#index-body');
toggleEl.addEventListener(
  'click',
  function () {
    if (!wakeLockEnabled) {
      noSleep.enable();
      wakeLockEnabled = true;
    } else {
    }
  },
  false
);

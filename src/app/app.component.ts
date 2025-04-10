import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopUpWindowComponent } from './legacy-admin/components/pop-up-window/pop-up-window.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [PopUpWindowComponent, RouterOutlet],
})
export class AppComponent {}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopUpWindowComponent } from './components/pop-up-window/pop-up-window.component';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [PopUpWindowComponent, RouterOutlet],
})
export class AppComponent {
  constructor() {}
}

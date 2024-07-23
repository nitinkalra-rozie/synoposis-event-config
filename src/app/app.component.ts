import { Component, OnDestroy, OnInit } from '@angular/core';
import { WakeLockService } from './services/wake-lock.service';
import NoSleep from '@uriopass/nosleep.js';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private wakeLockService :WakeLockService ){}
}

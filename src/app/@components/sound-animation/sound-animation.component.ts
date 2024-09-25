import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sound-animation',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './sound-animation.component.html',
  styleUrl: './sound-animation.component.scss',
})
export class SoundAnimationComponent {}

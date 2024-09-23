import { Component } from '@angular/core';
import { ProjectionImageComponent } from '@syn/components';

@Component({
  selector: 'app-project-image-selection',
  standalone: true,
  imports: [ProjectionImageComponent],
  templateUrl: './project-image-selection.component.html',
  styleUrl: './project-image-selection.component.scss',
})
export class ProjectImageSelectionComponent {}

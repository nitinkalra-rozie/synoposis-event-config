import { Component, output } from '@angular/core';
import { ProjectionImageComponent } from '@syn/components';
import { ProjectionData } from '@syn/data-services';

@Component({
  selector: 'app-project-image-selection',
  standalone: true,
  imports: [ProjectionImageComponent],
  templateUrl: './project-image-selection.component.html',
  styleUrl: './project-image-selection.component.scss',
})
export class ProjectImageSelectionComponent {
  public screenProjected = output<ProjectionData>();
}

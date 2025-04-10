import { Component, output } from '@angular/core';
import { ProjectionImageComponent } from 'src/app/legacy-admin/@components/projection-image/projection-image.component';
import { ProjectionData } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';

@Component({
  selector: 'app-project-image-selection',
  imports: [ProjectionImageComponent],
  templateUrl: './project-image-selection.component.html',
  styleUrl: './project-image-selection.component.scss',
})
export class ProjectImageSelectionComponent {
  public screenProjected = output<ProjectionData>();
}

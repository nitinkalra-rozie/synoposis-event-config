import { Pipe, PipeTransform } from '@angular/core';
import { RightSidebarSelectedAction } from 'src/app/legacy-admin/@models/global-state';

@Pipe({
  name: 'selectedQuickActionHeaderTitle',
  standalone: true,
})
export class SelectedQuickActionHeaderTitlePipe implements PipeTransform {
  transform(selectedAction: RightSidebarSelectedAction): string {
    switch (selectedAction) {
      case RightSidebarSelectedAction.AllLiveSessions: {
        return 'All Live Sessions';
      }
      case RightSidebarSelectedAction.SessionDetails: {
        return 'Session Details';
      }
      case RightSidebarSelectedAction.Transcript: {
        return 'Transcript';
      }
      default:
        return '';
    }
  }
}

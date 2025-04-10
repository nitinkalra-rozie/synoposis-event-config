import { Route } from '@angular/router';
import { ContentEditorComponent } from 'src/app/content-editor/content-editor.component';

// TODO:SYN-908: Configure routes for event wide and days content
// TODO: Configure routes for session content considering tracks
export const contentEditorRoutes: Route[] = [
  {
    path: '',
    component: ContentEditorComponent,
    title: 'Rozie Synopsis - Content Editor',
  },
];

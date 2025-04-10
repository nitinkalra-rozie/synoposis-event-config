import { Route } from '@angular/router';
import { InsightsEditorComponent } from 'src/app/insights-editor/insights-editor.component';

export const insightsEditorRoutes: Route[] = [
  {
    path: '',
    component: InsightsEditorComponent,
    title: 'Rozie Synopsis - Insights Editor',
  },
];

import { Session } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';

export interface SessionWithDropdownOptions {
  value: string;
  label: string;
  session: Session;
}

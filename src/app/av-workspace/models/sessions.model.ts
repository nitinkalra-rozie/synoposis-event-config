import { Session } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';

export interface SessionWithDropdownOptions {
  value: string;
  label: string;
  session: Session;
}

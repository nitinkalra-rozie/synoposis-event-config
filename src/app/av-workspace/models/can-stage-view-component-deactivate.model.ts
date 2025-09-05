import { Observable } from 'rxjs';

export interface CanStageViewComponentDeactivate {
  canDeactivate?(): Observable<boolean> | boolean;
  pauseCurrentSession?(): void;
}

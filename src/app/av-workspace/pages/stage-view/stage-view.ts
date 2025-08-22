import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChild,
} from '@angular/core';
import { CanDeactivateComponent } from 'src/app/av-workspace/guards/can-deactivate-component.interface';
import { LiveSessionState } from 'src/app/legacy-admin/@data-services/event-details/event-details.data-model';
import { DashboardFiltersStateService } from 'src/app/legacy-admin/@services/dashboard-filters-state.service';
import { ElsaEventAdminV2Component } from 'src/app/legacy-admin/components/elsa-event-admin-v2/elsa-event-admin-v2.component';
import { SessionContentComponent } from 'src/app/legacy-admin/components/session-content/session-content.component';

@Component({
  selector: 'app-stage-view',
  templateUrl: './stage-view.html',
  styleUrl: './stage-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ElsaEventAdminV2Component],
})
export class StageView implements CanDeactivateComponent {
  private readonly _dashboardService = inject(DashboardFiltersStateService);

  @ViewChild(ElsaEventAdminV2Component)
  private _elsaComponent?: ElsaEventAdminV2Component;

  canDeactivate(): boolean {
    return true;
  }

  pauseCurrentSession(): void {
    if (this._elsaComponent) {
      const sessionContent = this.getSessionContentComponent();
      sessionContent?.closeSocket();
    }

    this._dashboardService.setLiveSessionState(LiveSessionState.Paused);
  }

  private getSessionContentComponent(): SessionContentComponent | null {
    return this._elsaComponent?.getSessionContentComponent() ?? null;
  }
}

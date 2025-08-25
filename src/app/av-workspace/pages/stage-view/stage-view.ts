import {
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { CanDeactivateComponent } from 'src/app/av-workspace/guards/can-deactivate-component.interface';
import { AvWorkspaceLegacyOperationsService } from 'src/app/legacy-admin/@services/av-workspace-legacy-operations.service';
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
  private readonly _legacyOperations = inject(
    AvWorkspaceLegacyOperationsService
  );

  private readonly _elsaComponent = viewChild(ElsaEventAdminV2Component);

  pauseCurrentSession(): void {
    if (this._elsaComponent) {
      const sessionContent = this.getSessionContentComponent();
      sessionContent?.closeSocket();
    }

    this._legacyOperations.pauseSessionState();
  }

  private getSessionContentComponent(): SessionContentComponent | null {
    return this._elsaComponent()?.getSessionContentComponent() ?? null;
  }
}

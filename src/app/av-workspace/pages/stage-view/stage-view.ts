import {
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { CanStageViewComponentDeactivate } from 'src/app/av-workspace/models/can-stage-view-component-deactivate.model';
import { StageViewLegacyOperationsFacade } from 'src/app/legacy-admin/@facade/stage-view-legacy-operation-facade';

import { ElsaEventAdminV2Component } from 'src/app/legacy-admin/components/elsa-event-admin-v2/elsa-event-admin-v2.component';
import { SessionContentComponent } from 'src/app/legacy-admin/components/session-content/session-content.component';

@Component({
  selector: 'app-stage-view',
  templateUrl: './stage-view.html',
  styleUrl: './stage-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ElsaEventAdminV2Component],
})
export class StageView implements CanStageViewComponentDeactivate {
  //#region this is temporary. Until the stage view is out of legacy code this is needed
  protected readonly _elsaComponent = viewChild(ElsaEventAdminV2Component);

  private readonly _stageViewLegacyOperationsFacade = inject(
    StageViewLegacyOperationsFacade
  );

  pauseCurrentSession(): void {
    if (this._elsaComponent()) {
      const sessionContent = this.getSessionContentComponent();
      sessionContent?.closeSocket();
    }

    this._stageViewLegacyOperationsFacade.pauseSessionState();
  }

  private getSessionContentComponent(): SessionContentComponent | null {
    return this._elsaComponent()?.getSessionContentComponent() ?? null;
  }
}
//#endregion this is temporary. Until the stage view is out of legacy code this is needed

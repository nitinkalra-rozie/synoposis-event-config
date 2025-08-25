import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElsaEventAdminV2Component } from '../../../legacy-admin/components/elsa-event-admin-v2/elsa-event-admin-v2.component';

@Component({
  selector: 'app-stage-view',
  templateUrl: './stage-view.html',
  styleUrl: './stage-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ElsaEventAdminV2Component],
})
export class StageView {}

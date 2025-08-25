import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StageStatusType } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';
import { StageStatusConfig } from 'src/app/av-workspace/models/stage-statuses.model';

const STAGE_STATUS_CONFIG: Record<StageStatusType, StageStatusConfig> = {
  OFFLINE: {
    icon: 'syn:status_offline',
    text: 'Offline',
  },
  AUDIO_NOT_RECEIVING: {
    icon: 'syn:status_error',
    text: 'Audio Not Receiving',
  },
  TRANSCRIPT_NOT_RECEIVING: {
    icon: 'syn:status_error',
    text: 'Transcript Failed',
  },
  ONLINE: {
    icon: 'syn:status_online',
    text: 'Online',
  },
  ONLINE_AND_PROJECTING: {
    icon: 'syn:status_online_projecting',
    text: 'Online and Projecting',
  },
};

@Component({
  selector: 'app-stage-status',
  templateUrl: './stage-status.html',
  styleUrl: './stage-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
})
export class StageStatus {
  public readonly status = input.required<StageStatusType>();

  public readonly statusConfig = computed(() => {
    const currentStatus = this.status();
    return STAGE_STATUS_CONFIG[currentStatus];
  });
}

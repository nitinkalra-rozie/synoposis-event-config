import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  StageStatusConfig,
  StageStatusType,
} from 'src/app/av-workspace/models/stage-statuses.model';

// TODO:SYN-1289: Correct the types once the backend provides the correct values
const STAGE_STATUS_CONFIG: Record<StageStatusType, StageStatusConfig> = {
  Offline: {
    icon: 'syn:status_offline',
    text: 'Offline',
  },
  audio_error: {
    icon: 'syn:status_error',
    text: 'Audio Not Receiving',
  },
  transcript_error: {
    icon: 'syn:status_error',
    text: 'Transcript Failed',
  },
  online: {
    icon: 'syn:status_online',
    text: 'Online',
  },
  projecting: {
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

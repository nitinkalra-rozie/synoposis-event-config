import { StageStatusType } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';

export const STAGE_STATUS_ORDER: StageStatusType[] = [
  'OFFLINE',
  'AUDIO_NOT_RECEIVING',
  'TRANSCRIPT_NOT_RECEIVING',
  'ONLINE_AND_PROJECTING',
  'ONLINE',
];

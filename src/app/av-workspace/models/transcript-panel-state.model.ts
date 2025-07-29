import { StageActionType } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';

export type TranscriptPanelActionType = StageActionType | 'SESSION_NOT_STARTED';

export interface TranscriptPanelState {
  isOpen: boolean;
  stageName: string;
  currentAction: TranscriptPanelActionType;
}

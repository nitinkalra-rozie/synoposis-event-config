export enum StageViewSessionState {
  Playing = 'PLAYING',
  Paused = 'PAUSED',
  Stopped = 'STOPPED',
}

export interface StageViewSessionRequest {
  isLeavingStageView: boolean;
  isSessionActive: boolean;
}

export interface StageViewSessionResult {
  canDeactivate: boolean;
  requiresConfirmation: boolean;
  dialogMessage?: string;
  dialogTitle?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

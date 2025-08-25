export enum AVWorkspaceSessionState {
  Playing = 'PLAYING',
  Paused = 'PAUSED',
  Stopped = 'STOPPED',
}

export interface AVWorkspaceDeactivationRequest {
  isLeavingStageView: boolean;
  isSessionActive: boolean;
  destinationName: string;
  isSwitchingToCentralized: boolean;
}

export interface AVWorkspaceDeactivationResult {
  canDeactivate: boolean;
  requiresConfirmation: boolean;
  dialogMessage?: string;
  dialogTitle?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

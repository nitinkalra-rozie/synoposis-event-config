export interface StageViewDialogCancelledEvent extends CustomEvent {
  detail: {
    stayInStage: boolean;
    attemptedDestination: string;
    currentUrl: string;
  };
}

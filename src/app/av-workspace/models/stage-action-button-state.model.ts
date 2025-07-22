export interface StageActionButtonState {
  canToggleAutoAv: boolean;
  canStop: boolean;
  startPauseResumeButton: {
    isEnabled: boolean;
    isLoading: boolean;
    action: 'start' | 'pause' | 'resume';
    icon: string;
  };
}

export interface StageAutoAvToggleState {
  stage: string;
  isChecked: boolean;
}

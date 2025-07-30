export interface StageActionButtonState {
  canToggleAutoAv: boolean;
  canStop: boolean;
  startPauseResumeButton: {
    isEnabled: boolean;
    isLoading: boolean;
    action: 'start' | 'pause' | 'resume';
    icon: 'syn:loading_spinner' | 'syn:mic_outlined' | 'pause';
  };
  canOpenTranscriptPanel: boolean;
}

export interface StageAutoAvToggleState {
  stage: string;
  isChecked: boolean;
}

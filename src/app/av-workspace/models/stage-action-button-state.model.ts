export interface StageActionButtonState {
  canStop: boolean;
  startPauseResumeButton: {
    isEnabled: boolean;
    action: 'start' | 'pause' | 'resume';
    icon: string;
  };
}

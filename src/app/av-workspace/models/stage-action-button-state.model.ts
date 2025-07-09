export interface StageActionButtonState {
  canStop: boolean;
  startPauseResumeButton: {
    isEnabled: boolean;
    isLoading: boolean;
    action: 'start' | 'pause' | 'resume';
    icon: string;
  };
}

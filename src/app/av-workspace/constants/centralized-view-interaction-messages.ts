export const CENTRALIZED_VIEW_TOAST_MESSAGES = {
  DURATION: 5000,
  START_LISTENING:
    'Start Listening command sent. The stage status will update automatically',
  PAUSE_LISTENING:
    'Pause Listening command sent. The stage status will update automatically',
  END_LISTENING:
    'End Listening command sent. The stage status will update automatically',
};

export const CENTRALIZED_VIEW_DIALOG_MESSAGES = {
  PAUSE: {
    TITLE: 'Pause Listening?',
    MESSAGE: (stage: string) => `Do you want to Pause Listening for ${stage}?`,
  },
  END: {
    TITLE: 'End Listening?',
    MESSAGE: (stage: string) => `Do you want to End Listening for ${stage}?`,
  },
};

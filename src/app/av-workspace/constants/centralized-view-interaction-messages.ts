export const CENTRALIZED_VIEW_TOAST_MESSAGES = {
  DURATION: 5000,
  START_LISTENING: 'Stage will start listening shortly.',
  PAUSE_LISTENING: 'Stage will pause listening shortly.',
  END_LISTENING: 'Session will end shortly.',
  NO_STAGES_TO_START_LISTENING:
    'Select an idle stage with an assigned session to start listening.',
  NO_STAGES_TO_PAUSE_LISTENING:
    'Select a stage that is currently listening to pause.',
  NO_STAGES_TO_END_LISTENING: 'Select an active stage to end its session.',
  START_LISTENING_MULTIPLE_STAGES: (numOfStages: number) =>
    `Starting listening for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }.`,
  PAUSE_LISTENING_MULTIPLE_STAGES: (numOfStages: number) =>
    `Pausing listening for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }.`,
  END_LISTENING_MULTIPLE_STAGES: (numOfStages: number) =>
    `Ending sessions for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }.`,
  START_LISTENING_MULTIPLE_STAGES_ERROR: (numOfStages: number) =>
    `Couldn't start listening for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. Please try again.`,
  PAUSE_LISTENING_MULTIPLE_STAGES_ERROR: (numOfStages: number) =>
    `Couldn't pause listening for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. Please try again.`,
  END_LISTENING_MULTIPLE_STAGES_ERROR: (numOfStages: number) =>
    `Couldn't end sessions for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. Please try again.`,
};

export const CENTRALIZED_VIEW_DIALOG_MESSAGES = {
  PAUSE: {
    TITLE: 'Pause Listening?',
    MESSAGE: (stage: string) => `Do you want to Pause Listening for ${stage}?`,
  },
  END: {
    TITLE: 'End Session?',
    MESSAGE: (stage: string) => `Do you want to End Session for ${stage}?`,
  },
  AUTO_AV: {
    TITLE: (isChecked: boolean) =>
      `${isChecked ? 'Enable' : 'Disable'} AutoAV?`,
    MESSAGE: (stage: string, isChecked: boolean) =>
      `Do you want to ${isChecked ? 'Enable' : 'Disable'} AutoAV for ${stage}?`,
  },
  PAUSE_MULTIPLE: {
    TITLE: 'Pause Listening?',
    MESSAGE: (numOfStages: number) =>
      `Do you want to Pause Listening for ${numOfStages} selected stage${
        numOfStages > 1 ? 's' : ''
      }?`,
  },
  END_MULTIPLE: {
    TITLE: 'End Sessions?',
    MESSAGE: (numOfStages: number) =>
      `Do you want to End Session for ${numOfStages} selected stage${
        numOfStages > 1 ? 's' : ''
      }?`,
  },
};

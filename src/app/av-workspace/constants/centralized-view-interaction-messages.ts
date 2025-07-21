export const CENTRALIZED_VIEW_TOAST_MESSAGES = {
  DURATION: 5000,
  START_LISTENING:
    'Start Listening command sent. The stage status will update automatically',
  PAUSE_LISTENING:
    'Pause Listening command sent. The stage status will update automatically',
  END_LISTENING:
    'End Listening command sent. The stage status will update automatically',
  NO_STAGES_TO_START_LISTENING:
    'No stages to start listening. Please select a stage that is online, has a session selected and is not currently listening.',
  START_LISTENING_MULTIPLE_STAGES: (numOfStages: number) =>
    `Start Listening command sent for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. The stage statuses will update automatically`,
  START_LISTENING_MULTIPLE_STAGES_ERROR: (numOfStages: number) =>
    `Start Listening command failed for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. Please try again.`,
  NO_STAGES_TO_PAUSE_LISTENING:
    'No stages to pause listening. Please select stages that are currently listening.',
  PAUSE_LISTENING_MULTIPLE_STAGES: (numOfStages: number) =>
    `Pause Listening command sent for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. The stage statuses will update automatically`,
  PAUSE_LISTENING_MULTIPLE_STAGES_ERROR: (numOfStages: number) =>
    `Pause Listening command failed for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. Please try again.`,
  NO_STAGES_TO_END_LISTENING:
    'No stages to end listening. Please select stages that are currently listening or paused.',
  END_LISTENING_MULTIPLE_STAGES: (numOfStages: number) =>
    `End Listening command sent for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. The stage statuses will update automatically`,
  END_LISTENING_MULTIPLE_STAGES_ERROR: (numOfStages: number) =>
    `End Listening command failed for ${numOfStages} selected stage${
      numOfStages > 1 ? 's' : ''
    }. Please try again.`,
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
  PAUSE_MULTIPLE: {
    TITLE: 'Pause Listening?',
    MESSAGE: (numOfStages: number) =>
      `Do you want to Pause Listening for ${numOfStages} selected stage${
        numOfStages > 1 ? 's' : ''
      }?`,
  },
  END_MULTIPLE: {
    TITLE: 'End Listening?',
    MESSAGE: (numOfStages: number) =>
      `Do you want to End Listening for ${numOfStages} selected stage${
        numOfStages > 1 ? 's' : ''
      }?`,
  },
};

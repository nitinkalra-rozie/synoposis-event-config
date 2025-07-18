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
  START_LISTENING_MULTIPLE_STAGES: (noOfStages: number) =>
    `Start Listening command sent for ${noOfStages} selected stages. The stage statuses will update automatically`,
  NO_STAGES_TO_PAUSE_LISTENING:
    'No stages to pause listening. Please select stages that are currently listening.',
  PAUSE_LISTENING_MULTIPLE_STAGES: (noOfStages: number) =>
    `Pause Listening command sent for ${noOfStages} selected stages. The stage statuses will update automatically`,
  NO_STAGES_TO_END_LISTENING:
    'No stages to end listening. Please select stages that are currently listening or paused.',
  END_LISTENING_MULTIPLE_STAGES: (noOfStages: number) =>
    `End Listening command sent for ${noOfStages} selected stages. The stage statuses will update automatically`,
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

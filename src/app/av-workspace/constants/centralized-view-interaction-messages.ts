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
    TITLE: 'End Listening?',
    MESSAGE: (numOfStages: number) =>
      `Do you want to End Listening for ${numOfStages} selected stage${
        numOfStages > 1 ? 's' : ''
      }?`,
  },
  TAB_SWITCHING: {
    LEAVE_STAGE_VIEW: {
      TITLE: 'Leave Stage View?',
      MESSAGE:
        'You are currently managing a stage session. Switching to Centralized View may disconnect your active audio stream and interrupt ongoing ' +
        'session monitoring. Are you sure you want to continue?',
    },
    LEAVE_CENTRALIZED_VIEW: {
      TITLE: 'Leave Centralized View?',
      MESSAGE:
        'You may have active sessions or configuration changes. Switching to Stage View will change your current workflow. Continue?',
    },
    BUTTON_TEXT: {
      SWITCH_TO_STAGE_VIEW: 'Switch to Stage View',
      SWITCH_TO_CENTRALIZED_VIEW: 'Switch to Centralized View',
      STAY_IN_STAGE_VIEW: 'Stay in Stage View',
      STAY_IN_CENTRALIZED_VIEW: 'Stay in Centralized View',
    },
  },
};

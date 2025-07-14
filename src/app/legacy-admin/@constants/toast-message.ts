export const TOAST_MESSAGES = {
  DURATION: 5000,

  THEME: {
    SUCCESS: (theme: string) => `Theme color is ${theme}`,
    ERROR: 'Failed to change theme color.',
  },

  BACKUP: {
    SUCCESS: 'Backup message sent successfully!',
    ERROR: 'Failed to send backup message.',
  },

  START_SESSION: {
    SUCCESS: 'Start session message sent successfully!',
    ERROR: 'Failed to send start session message.',
  },

  END_SESSION: {
    SUCCESS: 'End session message sent successfully!',
    ERROR: 'Failed to send end session message.',
  },

  END_EVENT: {
    SUCCESS: 'End event message sent successfully!',
    ERROR: 'Failed to send end event message.',
  },

  END_BREAKOUT_SESSION: {
    SUCCESS: 'End breakout session message sent successfully!',
    ERROR: 'Failed to send end breakout session message.',
  },

  TRANSCRIPT: {
    ERROR: 'Failed to store transcript',
  },
};

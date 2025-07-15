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

  ANALYTICS: {
    NO_EVENT_SELECTED: 'No event selected. Redirecting to admin page.',
    GENERATING_PDF: 'Generating PDF...',
    PDF_SUCCESS: 'PDF downloaded successfully',
    CSV_SUCCESS: 'CSV downloaded successfully',
    INVALID_DATE_RANGE: 'Please select a valid date range',
    MISSING_DATES: 'Please select start and end dates',
    EXPORT_STARTED: 'Export Started - Report download in progress...',
    EXPORT_SUCCESS: 'Report downloaded successfully!',
    EXPORT_ERROR: 'Export Failed - Please try again later',
    EXPORT_ERROR_WITH_MESSAGE: (message: string) =>
      `Export error: ${message || 'Unknown error'}`,
    USER_DETAILS_COMING_SOON: 'User details feature coming soon',
  },
};

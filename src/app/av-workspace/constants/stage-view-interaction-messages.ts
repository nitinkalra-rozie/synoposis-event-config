export const STAGE_VIEW_DIALOG_MESSAGES = {
  LEAVE_STAGE_VIEW: {
    TITLE: 'Active Session in Progress',
    CONFIRM_BUTTON_TEXT: (destinationName: string) =>
      `Switch to ${destinationName}`,
    CANCEL_BUTTON_TEXT: 'Continue Session',
    MESSAGE: {
      WITH_ACTIVE_SESSION: (destinationName: string) =>
        `You have an active live session running in Stage View. Switching to ${destinationName} will automatically
       pause your session and may interrupt the live experience for attendees.\n\nDo you want to pause the session and proceed?`,
    },
  },
};

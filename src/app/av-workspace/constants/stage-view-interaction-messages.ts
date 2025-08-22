export const STAGE_VIEW_DIALOG_MESSAGES = {
  LEAVE_STAGE_VIEW: {
    TITLE: 'Leave Stage View?',
    CONFIRM_BUTTON_TEXT: (destinationName: string) =>
      `Switch to ${destinationName}`,
    CANCEL_BUTTON_TEXT: 'Stay in Stage View',
    MESSAGE: {
      WITH_ACTIVE_SESSION: (destinationName: string) =>
        `You are currently managing an active session. Switching to ${destinationName} will pause your session. Continue?`,
      WITHOUT_ACTIVE_SESSION: (destinationName: string) =>
        `Are you sure you want to switch to ${destinationName}?`,
    },
  },
};

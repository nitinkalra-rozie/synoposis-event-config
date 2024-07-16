import { ThemeOptions, TimeWindowsEnum, TransitionTimesEnum } from './enums';

export const INITIAL_POST_DATA = {
  action: '',
  day: '',
  domain: '',
  eventName: 'Select event',
  keyNoteData: '',
  screenTimeout: 15,
  sessionId: '',
  sessionTitle: '',
  theme: ThemeOptions.light,
  transcript: '',
};

export const TimeWindows = {
  [TimeWindowsEnum['60 Seconds']]: 60,
  [TimeWindowsEnum['75 Seconds']]: 75,
  [TimeWindowsEnum['90 Seconds']]: 90,
};

export const TransitionTimes = {
  [TransitionTimesEnum['15 Seconds']]: 15,
  [TransitionTimesEnum['30 Seconds']]: 30,
  [TransitionTimesEnum['45 Seconds']]: 45,
};

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
  theme: ThemeOptions.Light,
  transcript: '',
};

export const TimeWindows = {
  [TimeWindowsEnum.Seconds60]: 60,
  [TimeWindowsEnum.Seconds75]: 75,
  [TimeWindowsEnum.Seconds90]: 90,
};

export const TransitionTimes = {
  [TransitionTimesEnum.Seconds15]: 15,
  [TransitionTimesEnum.Seconds30]: 30,
  [TransitionTimesEnum.Seconds45]: 45,
};

export const RoleRank = {
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

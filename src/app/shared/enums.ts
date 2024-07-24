export enum ThemeOptions {
  dark = 'Dark',
  light = 'Light',
}

export enum EventDetailType {
  BreakoutSession = 'BreakoutSession',
  PrimarySession = 'PrimarySession',
  IntroSession = 'IntroSession',
}

export enum ScreenDisplayType {
  EventSpecific = 'EventSpecific',
  SessionSpecific = 'SessionSpecific',
  MultiSession = 'MultiSession',
}

export enum EventCardType {
  Welcome = 'Welcome',
  ThankYou = 'ThankYou',
  Info = 'Info',
}

export enum PostDataEnum {
  action = 'action',
  sessionId = 'sessionId',
  eventName = 'eventName',
  domain = 'domain',
  day = 'day',
  keyNoteData = 'keyNoteData',
  transcript = 'transcript',
  screenTimeout = 'screenTimeout',
  sessionTitle = 'sessionTitle',
  theme = 'theme',
}

export enum TimeWindowsEnum {
  '60 Seconds' = '60 Seconds',
  '75 Seconds' = '75 Seconds',
  '90 Seconds' = '90 Seconds',
}

export enum TransitionTimesEnum {
  '15 Seconds' = '15 Seconds',
  '30 Seconds' = '30 Seconds',
  '45 Seconds' = '45 Seconds',
}

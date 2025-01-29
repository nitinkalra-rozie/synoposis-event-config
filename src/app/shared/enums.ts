export enum ThemeOptions {
  Dark = 'Dark',
  Light = 'Light',
}

export enum EventDetailType {
  BreakoutSession = 'BreakoutSession',
  PrimarySession = 'PrimarySession',
  IntroSession = 'IntroSession',
  Session = 'Session',
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
  Action = 'action',
  SessionId = 'sessionId',
  EventName = 'eventName',
  Domain = 'domain',
  Day = 'day',
  KeyNoteData = 'keyNoteData',
  Transcript = 'transcript',
  ScreenTimeout = 'screenTimeout',
  SessionTitle = 'sessionTitle',
  Theme = 'theme',
}

export enum TimeWindowsEnum {
  Seconds60 = '60 Seconds',
  Seconds75 = '75 Seconds',
  Seconds90 = '90 Seconds',
}

export enum TransitionTimesEnum {
  Seconds15 = '15 Seconds',
  Seconds30 = '30 Seconds',
  Seconds45 = '45 Seconds',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}

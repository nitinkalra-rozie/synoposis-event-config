interface Language {
  value: string;
  code: string;
  label: string;
}

interface Features {
  ShowAgendaDateFilter: boolean;
  ShowPromotionalMessage: boolean;
  ShowHashtags: boolean;
  ShowAgendaTrackFilter: boolean;
  ShowSponsorsInfoWhileLoadingDebrief: boolean;
  ShowTrackTrendsButton: boolean;
  ShowCollectEmailsDialog: boolean;
  ShowDailyDebriefButton: boolean;
  ShowModeratorsOnTop: boolean;
  ShowSessionCardTrack: boolean;
  ShowFooterSponsorLogo: boolean;
  ShowAccessSessionReportsButton: boolean;
  ShowSessionCardTime: boolean;
  ShowSpeakersFilter: boolean;
  EnableTranslation: boolean;
}

interface ThemeColors {
  CardGradientHoverEnd: string;
  PrimaryGradientStart: string;
  PrimaryColorVariant2: string;
  BackgroundPatchLeftTop: string;
  CardGradientHoverStart: string;
  BackgroundPatchGradientBottomEnd: string;
  BackgroundPatchRightMiddle: string;
  BackgroundPatchGradientBottomStart: string;
  BackgroundPatchLeftMiddle: string;
  PrimaryGradientEnd: string;
}

interface LightTheme {
  BackgroundImage: string;
  Colors: ThemeColors;
}

interface PDFReportTheme {
  topicsGradientColor1: string;
  headerBackgroundGradientColor1: string;
  topicsGradientColor2: string;
  headerBackgroundGradientColor2: string;
  headerBackgroundGradientColor3: string;
  backgroundGradientColor1: string;
  backgroundMask: string;
  checkboxIcon: string;
  headerSpeakerBioGradient1: string;
  primaryColor: string;
  backgroundGradientColor2: string;
  backgroundGradientColor3: string;
  headerSpeakerBioGradient2: string;
  eventLogoDark: string;
  contentBackgroundColor1: string;
  contentBackgroundColor2: string;
  rozieLogoBackgroundColor2: string;
  rozieLogoBackgroundColor1: string;
  eventLogoLight: string;
  speaker_bio: boolean;
  secondaryColor: string;
}

interface AudioConfig {
  Speed: number;
  StyleExaggeration: number;
  Stability: number;
  SpeakerBoost: boolean;
  Volume: number;
  Service: string;
  SimilarityBoost: number;
  VoiceId: string;
  AudioAutoGeneration: boolean;
  ModelId: string;
}

interface EventInformation {
  Timezone: string;
  EventDomain: string;
  BoothNumber: string;
  EventNameDisplay: string;
  FooterUrl: string;
  Images: {
    EventQR: string;
  };
  SelectedLanguage: string;
  Hashtags: string;
  Texts: {
    WelcomeMessage: string;
    ThankYouMessage: string;
  };
  Logos: {
    Dark: string;
    Light: string;
  };
}

interface Sponsor {
  Logo: string;
  Name: string;
}

export interface EventConfig {
  Domain: string;
  EventIdentifier: string;
  SupportedLanguages: Language[];
  OriginalLanguageCode: string;
  Features: Features;
  ModelSettings: {
    Provider: string;
  };
  Themes: {
    Light: LightTheme;
    PDFReport: PDFReportTheme;
  };
  AudioConfig: AudioConfig;
  Information: EventInformation;
  updatedAt: string;
  Sponsors: Sponsor[];
  eventStatus: string;
}

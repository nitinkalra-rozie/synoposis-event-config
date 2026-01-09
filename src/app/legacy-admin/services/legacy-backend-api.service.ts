import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import { getLocalStorageItem } from 'src/app/shared/utils/local-storage-util';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';

@Injectable({ providedIn: 'root' })
// TODO:@refactor this service to use defined types instead of objects
export class LegacyBackendApiService {
  constructor(
    private http: HttpClient,
    private _globalStateService: GlobalStateService
  ) {}

  // TODO:@later move these to a config state service
  private _currentEventDomain: string = '';
  private _currentTimezone: string = '';

  getEventDetails(): Observable<Object> {
    return this._getEventConfigs();
  }

  // TODO:@later move these to a config state service
  getCurrentEventName(): string | null {
    return getLocalStorageItem<string>('SELECTED_EVENT_NAME');
  }

  getCurrentEventDomain(): string | null {
    return getLocalStorageItem<string>('EVENT_LLM_DOMAIN');
  }

  getCurrentTimezone(): string {
    return this._currentTimezone;
  }

  setCurrentTimezone(timezone: string): void {
    this._currentTimezone = timezone;
  }

  getTranscriberPreSignedUrl(body: any): Observable<Object> {
    return this.http.post(environment.getTranscriberPreSignedUrl, body);
  }

  putTranscript(transcript: any): Observable<Object> {
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
      stage: localStorage.getItem('currentStage'),
      primarySessionId: localStorage.getItem('currentPrimarySessionId'),
      transcript: transcript,
      eventName: localStorage.getItem('selectedEvent'),
      domain: localStorage.getItem('domain'),
    };
    return this.http.post(environment.putTranscript, body);
  }
  // action:any,sessionId:any,flag:any,day:any, data?:any,sessionTitle?:any,theme?:any, eventName?:any, domain?:any
  postData(data: PostData): Observable<Object> {
    const body = {
      action: data.action,
      sessionId: localStorage.getItem('currentSessionId'),
      sessionIds: data.sessionIds,
      eventName: data.eventName || localStorage.getItem('selectedEvent'),
      domain: data.domain || localStorage.getItem('domain'),
      day: data.day || localStorage.getItem('currentDay'),
      keyNoteData: data.keyNoteData || {},
      screenTimeout: parseInt(localStorage.getItem('postInsideInterval')) || 15,
      sessionTitle: data.sessionTitle || '',
      theme: data.theme,
      transcript: data.transcript,
      sessionDescription: data.sessionDescription,
      debriefType: data.debriefType ?? null,
      debriefFilter: data.debriefFilter ?? null,
      stage: data.stage,
    };
    if (data.action === 'realTimeInsights') {
      body.keyNoteData = {};
      body.transcript = data.transcript;
    }
    return this.http.post(environment.postData, body);
  }

  postCurrentSessionId(
    sessionId: any,
    eventName: any,
    domain: any,
    primarySessionId: any
  ): Observable<Object> {
    console.log('Inside postCurrent', sessionId);
    const body = {
      sessionId: sessionId,
      eventName: eventName,
      domain: domain,
      primarySessionId: primarySessionId,
    };
    return this.http.post(environment.postCurrentSessionId, body);
  }

  // TODO:@later move this to a config data service
  _getEventConfigs(): Observable<any> {
    return this.http.post(environment.apiBaseUrl + '/r3/getEventConfigAll', {});
  }

  updateEventConfigs(payload: {
    domain: string;
    eventNameIdentifier: string;
    enableTranslation?: boolean;
    eventStatus?: string;
    supportedLanguages?: Array<{ value: string; code: string; label: string }>;
    Sponsors?: Array<{ Logo: string; Name: string }>;
    originalLanguageCode?: string;
    enableDiarization?: boolean;
    modelProvider?: 'openai' | 'gemini';
    Themes?: any;
    AudioConfig?: {
      Stability: number;
      UseSpeakerBoost: boolean;
      Service: string;
      SimilarityBoost: number;
      Style: number;
      VoiceId: string;
      AudioAutoGeneration: boolean;
      ModelId: string;
    };
    Features?: {
      ShowAgendaDateFilter: boolean;
      ShowPromotionalMessage: boolean;
      ShowHashtags: boolean;
      ShowAgendaTrackFilter: boolean;
      ShowTrackTrendsButton: boolean;
      ShowSponsorsInfoWhileLoadingDebrief: boolean;
      ShowDailyDebriefButton: boolean;
      ShowCollectEmailsDialog: boolean;
      ShowModeratorsOnTop: boolean;
      ShowSessionCardTrack: boolean;
      ShowFooterSponsorLogo: boolean;
      ShowAccessSessionReportsButton: boolean;
      ShowSessionCardTime: boolean;
      ShowSpeakersFilter: boolean;
    };
    Information?: {
      Timezone: string;
      EventDomain: string;
      BoothNumber: string;
      EventNameDisplay: string;
      FooterUrl: string;
      Images: { EventQR: string };
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
    };
  }): Observable<any> {
    return this.http.post(
      environment.apiBaseUrl + '/r3/updateEventConfig',
      payload
    );
  }

  updateEventTemplate(eventIdentifier: string, template: any): Observable<any> {
    return this.http.post(environment.apiBaseUrl + '/r3/updateEventTemplate', {
      eventNameIdentifier: eventIdentifier,
      template: template,
    });
  }

  /**
   * Get eventIds that have both username and password parameters
   * @returns {Observable<any>} Observable with array of eventIds
   */
  getEventIds(): Observable<any> {
    return this.http.post(environment.apiBaseUrl + '/r3/getEventIds', {
      parameterFilters: [],
    });
  }

  /**
   * Create event parameters (username and password) for an event
   * @param {string} eventId - Event ID
   * @param {string} domain - Domain associated with the event
   * @returns {Observable<any>} Observable of the API response
   */
  createEventParameters(eventId: string, domain: string): Observable<any> {
    return this.http.post(
      environment.apiBaseUrl + '/r3/createEventParameters',
      { eventId, domain }
    );
  }
}

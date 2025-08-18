import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GlobalStateService } from 'src/app/legacy-admin/@services/global-state.service';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from 'src/app/shared/utils/local-storage-util';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';
import { SetPrimaryScreenProjectingResponse } from './legacy-backend-api.data-model';

@Injectable({ providedIn: 'root' })
// TODO:@refactor this service to use defined types instead of objects
export class LegacyBackendApiService {
  constructor(
    private http: HttpClient,
    private _globalStateService: GlobalStateService
  ) {}

  // TODO:@later move these to a config state service
  private _currentEventName: string = '';
  private _currentEventDomain: string = '';
  private _currentTimezone: string = '';

  getEventDetails(): Observable<Object> {
    return this._getEventConfig().pipe(
      switchMap((configResponse: any) => {
        const eventIdentifier = configResponse?.data?.EventIdentifier;
        this._currentEventDomain =
          configResponse?.data?.Information?.EventDomain || '';
        setLocalStorageItem('EVENT_LLM_DOMAIN', this._currentEventDomain);
        this.setCurrentTimezone(
          configResponse?.data?.Information?.Timezone || '+0:00'
        );
        this._currentEventName = eventIdentifier;
        setLocalStorageItem('SELECTED_EVENT_NAME', eventIdentifier);
        this._globalStateService.setSelectedDomain(this._currentEventDomain);
        return this.http.post(environment.getEventDetails, {
          event: eventIdentifier,
        });
      })
    );
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

  setPrimaryScreenProjecting(
    action: string,
    eventName: string,
    isProjecting: boolean,
    stage: string
  ): Observable<SetPrimaryScreenProjectingResponse> {
    return this.http.post<SetPrimaryScreenProjectingResponse>(
      environment.setAutoAvSetupUrl,
      {
        action,
        eventName,
        isProjecting,
        stage,
      }
    );
  }

  // TODO:@later move this to a config data service
  private _getEventConfig(): Observable<any> {
    const hostname = window.location.hostname;
    let domain =
      hostname === 'localhost' ? 'dev-sbx.synopsis.rozie.ai' : hostname;
    domain = domain.replace('admin.', '');

    return this.http.post(environment.getEventConfig, { domain });
  }
}

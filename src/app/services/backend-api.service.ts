import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';
import { Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
// TODO: @refactor this service to use defined types instead of objects
export class BackendApiService {
  constructor(private http: HttpClient) {}

  // TODO: @later move these to a config state service
  private _currentEventName: string = '';
  private _currentEventDomain: string = '';

  getEventDetails(): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });

    return this._getEventConfig().pipe(
      switchMap((configResponse: any) => {
        const eventNameIdentifier = configResponse?.data?.eventNameIdentifier;
        return this.http
          .post(
            environment.getEventDetails,
            { event: eventNameIdentifier },
            { headers }
          )
          .pipe(
            tap((response: any) => {
              if (response?.data?.length > 0) {
                this._currentEventName = response.data[0].Event;
                this._currentEventDomain = response.data[0].EventDomain;
              }
            })
          );
      })
    );
  }

  // TODO: @later move these to a config state service
  getCurrentEventName(): string {
    return this._currentEventName;
  }

  getCurrentEventDomain(): string {
    return this._currentEventDomain;
  }

  getTranscriberPreSignedUrl(body: any): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    return this.http.post(environment.getTranscriberPreSignedUrl, body, {
      headers: headers,
    });
  }

  putTranscript(transcript: any): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
      primarySessionId: localStorage.getItem('currentPrimarySessionId'),
      transcript: transcript,
      eventName: localStorage.getItem('selectedEvent'),
      domain: localStorage.getItem('domain'),
    };
    return this.http.post(environment.putTranscript, body, {
      headers: headers,
    });
  }
  // action:any,sessionId:any,flag:any,day:any, data?:any,sessionTitle?:any,theme?:any, eventName?:any, domain?:any
  postData(data: PostData): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      action: data.action,
      sessionId: localStorage.getItem('currentSessionId'),
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
    };
    if (data.action === 'realTimeInsights') {
      body.keyNoteData = {};
      body.transcript = data.transcript;
    }
    return this.http.post(environment.postData, body, { headers: headers });
  }

  postCurrentSessionId(
    sessionId: any,
    eventName: any,
    domain: any,
    primarySessionId: any
  ): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    console.log('Inside postCurrent', sessionId);
    const body = {
      sessionId: sessionId,
      eventName: eventName,
      domain: domain,
      primarySessionId: primarySessionId,
    };
    return this.http.post(environment.postCurrentSessionId, body, {
      headers: headers,
    });
  }

  // TODO: @later move this to a config data service
  private _getEventConfig(): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.CONFIG_X_API_KEY,
    });
    const hostname = window.location.hostname;
    const domain =
      hostname === 'localhost' ? 'dev-sbx.synopsis.rozie.ai' : hostname;

    return this.http.post(environment.getEventConfig, { domain }, { headers });
  }
}

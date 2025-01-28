import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';
import { Observable } from 'rxjs';
import { BackendApiService as LegacyBackendApiService } from 'src/app/services/backend-api.service';

@Injectable({
  providedIn: 'root',
})
// TODO: @refactor this service to use defined types instead of objects
export class BackendApiService {
  constructor(private http: HttpClient) {}

  private _backendApiService = inject(LegacyBackendApiService);

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
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
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

  generateRealtimeInsights(data: any): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      action: 'realTimeInsights',
      sessionId: data.sessionId,
      eventName: data.eventName,
      domain: this._backendApiService.getCurrentEventDomain(),
      day: data.day,
      keyNoteData: {},
      screenTimeout: 15,
      sessionTitle: data.sessionTitle,
      transcript: '',
      sessionDescription: data.sessionDescription,
    };
    return this.http.post(environment.postData, body, { headers: headers });
  }

  getVersionContent(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const params = new HttpParams()
      .set('eventId', this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('version', data.version);
    return this.http.get(environment.getVersionContentUrl, { headers, params });
  }

  saveEditedVersionContent(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      eventId: this._backendApiService.getCurrentEventName(),
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      version: data.version,
      updatedContent: data.updatedContent,
    };
    return this.http.post(environment.saveEditedVersionContentUrl, body, {
      headers: headers,
    });
  }

  getContentVersions(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const params = new HttpParams()
      .set('eventId', this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('promptVersion', data.promptVersion);
    return this.http.get(environment.getContentVersionsUrl, {
      headers,
      params,
    });
  }

  generateContentPDFUrl(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      eventId: this._backendApiService.getCurrentEventName(),
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      version: data.version,
    };
    return this.http.post(environment.generateContentPDFUrl, body, {
      headers: headers,
    });
  }

  getSignedPdfUrl(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const params = new HttpParams()
      .set('eventId', this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('version', data.version);
    return this.http.get(environment.getPreSignedPDFUrl, { headers, params });
  }

  generateContent(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      sessionTranscript: data.sessionTranscript,
      eventId: this._backendApiService.getCurrentEventName(),
      sessionTitle: data.sessionTitle,
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      transcriptSource: data.transcriptSource,
      promptVersion: data.promptVersion,
      childSectionSessionIds: data.childSectionSessionIds,
      speakers: data.speakers
    };
    console.log(body);
    return this.http.post(environment.genarateContentUrl, body, {
      headers: headers,
    });
  }

  changeEventStatus(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      action: data.action,
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
      eventName: this._backendApiService.getCurrentEventName(),
      domain: data.domain || localStorage.getItem('domain'),
      status: data.status,
      changeEditMode: data.changeEditMode,
      editor: data.editor,
    };
    return this.http.post(environment.postData, body, { headers: headers });
  }

  updatePostInsights(data: any): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      action: data.action,
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
      eventName: this._backendApiService.getCurrentEventName(),
      domain: data.domain || localStorage.getItem('domain'),
      updatedData: data.updatedData,
    };
    return this.http.post(environment.postData, body, { headers: headers });
  }

  getEventReport(data: PostData): Observable<any> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      action: data.action,
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
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
    return this.http.post(environment.postData, body, { headers: headers });
  }

  getEventDetails(): Observable<Object> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });
    return this.http.post(
      environment.getEventDetails,
      { event: this._backendApiService.getCurrentEventName() },
      { headers: headers }
    );
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
}

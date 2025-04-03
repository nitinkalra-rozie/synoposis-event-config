import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';
import { Observable } from 'rxjs';
import { BackendApiService as LegacyBackendApiService } from 'src/app/services/backend-api.service';

interface EventReportResponse {
  data?: {
    data?: Array<{
      snapshotData?: any; // Replace 'any' with a more specific type if possible
    }>;
  };
}

@Injectable({
  providedIn: 'root',
})
// TODO: @refactor this service to use defined types instead of objects
export class BackendApiService {
  constructor(private http: HttpClient) {}

  private _backendApiService = inject(LegacyBackendApiService);

  getTranscriberPreSignedUrl(body: any): Observable<Object> {
    return this.http.post(environment.getTranscriberPreSignedUrl, body);
  }

  sendEmailReport(page_size: string = '10'): Observable<Object> {
    const data = {
      action: 'emailTranscriptReport',
      sessionId: 'day2_session2',
      email: 'dinuka@rozie.ai',
    };
    // Pass the headers and the body as arguments to the post() method
    return this.http.post(environment.postData, data);
  }

  putTranscript(transcript: any): Observable<Object> {
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
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
    return this.http.post(environment.postData, body);
  }

  generateRealtimeInsights(data: any): Observable<Object> {
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
    return this.http.post(environment.postData, body);
  }

  getVersionContent(data: any): Observable<Object> {
    const params = new HttpParams()
      .set('eventId', this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('version', data.version);
    return this.http.get(environment.getVersionContentUrl, { params });
  }

  saveEditedVersionContent(data: any): Observable<Object> {
    const body = {
      eventId: this._backendApiService.getCurrentEventName(),
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      version: data.version,
      updatedContent: data.updatedContent,
    };
    return this.http.post(environment.saveEditedVersionContentUrl, body);
  }

  getContentVersions(data: any): Observable<Object> {
    const params = new HttpParams()
      .set('eventId', this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('promptVersion', data.promptVersion);
    return this.http.get(environment.getContentVersionsUrl, { params });
  }

  generateContentPDFUrl(data: any): Observable<Object> {
    const body = {
      eventId: this._backendApiService.getCurrentEventName(),
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      version: data.version,
    };
    return this.http.post(environment.generateContentPDFUrl, body);
  }

  getSignedPdfUrl(data: any): Observable<Object> {
    const params = new HttpParams()
      .set('eventId', this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('version', data.version)
      .set('promptVersion', data.promptVersion);
    return this.http.get(environment.getPreSignedPDFUrl, { params });
  }

  publishPdfReport(data: any): Observable<Object> {
    const body = {
      eventId: this._backendApiService.getCurrentEventName(),
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      promptVersion: data.promptVersion,
      version: data.version,
    };
    console.log(body);
    return this.http.post(environment.publishContentPDFUrl, body);
  }

  generateContent(data: any): Observable<Object> {
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
      speakers: data.speakers,
      generatePDF: data.generatePDF,
    };
    console.log(body);
    return this.http.post(environment.genarateContentUrl, body);
  }

  changeEventStatus(data: any): Observable<Object> {
    const body = {
      action: data.action,
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
      eventName: this._backendApiService.getCurrentEventName(),
      domain: data.domain || localStorage.getItem('domain'),
      status: data.status,
      changeEditMode: data.changeEditMode,
      editor: data.editor,
    };
    return this.http.post(environment.postData, body);
  }

  updatePostInsights(data: any): Observable<Object> {
    const body = {
      action: data.action,
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
      eventName: this._backendApiService.getCurrentEventName(),
      domain: data.domain || localStorage.getItem('domain'),
      updatedData: data.updatedData,
    };
    return this.http.post(environment.postDebriefData, body);
  }

  getEventReport(data: PostData): Observable<EventReportResponse> {
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
      sessionIds: data.sessionIds,
    };
    return this.http.post(environment.postDebriefData, body);
  }

  getEventDetails(): Observable<Object> {
    return this.http.post(environment.getEventDetails, {
      event: this._backendApiService.getCurrentEventName(),
    });
  }
  postCurrentSessionId(
    sessionId: string,
    eventName: string,
    domain: string,
    primarySessionId: string
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
}

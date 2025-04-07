import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventReportResponse } from 'src/app/editorial/data-service/editorial.data-model';
import { BackendApiService as LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { PostData } from 'src/app/legacy-admin/shared/types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EditorialDataService {
  private readonly _http = inject(HttpClient);
  private readonly _backendApiService = inject(LegacyBackendApiService);

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
    return this._http.post(environment.postDebriefData, body);
  }

  sendEmailReport(page_size: string = '10'): Observable<Object> {
    const data = {
      action: 'emailTranscriptReport',
      sessionId: 'day2_session2',
      email: 'dinuka@rozie.ai',
    };
    // Pass the headers and the body as arguments to the post() method
    return this._http.post(environment.postData, data);
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
    return this._http.post(environment.postData, body);
  }
  updatePostInsights(data: any): Observable<Object> {
    const body = {
      action: data.action,
      sessionId: data.sessionId || localStorage.getItem('currentSessionId'),
      eventName: this._backendApiService.getCurrentEventName(),
      domain: data.domain || localStorage.getItem('domain'),
      updatedData: data.updatedData,
    };
    return this._http.post(environment.postDebriefData, body);
  }

  getEventDetails(): Observable<Object> {
    return this._http.post(environment.getEventDetails, {
      event: this._backendApiService.getCurrentEventName(),
    });
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
    return this._http.post(environment.genarateContentUrl, body);
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
    return this._http.post(environment.postData, body);
  }
}

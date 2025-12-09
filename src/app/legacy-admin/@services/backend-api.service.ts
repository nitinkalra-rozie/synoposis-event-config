import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Session } from 'src/app/legacy-admin/@pages/event-configuration/event-configuration.component';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';

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
// TODO:@refactor this service to use defined types instead of objects
export class BackendApiService {
  constructor(private http: HttpClient) {}

  private _backendApiService = inject(LegacyBackendApiService);

  getUploadPresignedUrl(
    fileType: string,
    fileExtension: string
  ): Observable<Object> {
    const data = {
      action: 'uploadFile',
      eventName: this._backendApiService.getCurrentEventName(),
      clientType: 'client',
      fileType: fileType,
      fileExtension: fileExtension,
    };
    return this.http.post(environment.getUploadFilePresignedUrl, data);
  }

  uploadFileUsingPreSignedUrl(
    file: File,
    preSignedUrl: string
  ): Observable<any> {
    return this.http.put(preSignedUrl, file, {
      responseType: 'text',
    });
  }

  updateAgenda(data: Session[], timezone: string = ''): Observable<Object> {
    const body = {
      clearCurrentEvents: false,
      timeZoneUpdate: timezone,
      eventName: this._backendApiService.getCurrentEventName(),
      eventDetails: data,
    };
    return this.http.post(environment.updateAgendaUrl, body);
  }

  getVersionContent(data: any): Observable<Object> {
    const params = new HttpParams()
      .set('eventId', data.eventId || this._backendApiService.getCurrentEventName())
      .set('sessionId', data.sessionId)
      .set('sessionType', data.sessionType)
      .set('reportType', data.reportType)
      .set('version', data.version);
    return this.http.get(environment.getVersionContentUrl, { params });
  }

  saveEditedVersionContent(data: any): Observable<Object> {
    const body = {
      eventId: data.eventId || this._backendApiService.getCurrentEventName(),
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

  getContentVersionsByEventId(
    eventId: string,
    reportType?: string
  ): Observable<Object> {
    let params = new HttpParams()
      .set('eventId', eventId)
      .set('isOnlyEventId', 'true');

    if (reportType) {
      params = params.set('reportType', reportType);
    }

    const refreshToken = localStorage.getItem('accessToken');

    return this.http.get(environment.getContentVersionsUrl, { params });
  }

  generateContentPDFUrl(data: any): Observable<Object> {
    const body = {
      eventId: data.eventId || this._backendApiService.getCurrentEventName(),
      sessionId: data.sessionId,
      sessionType: data.sessionType,
      reportType: data.reportType,
      version: data.version,
      isSinglePrompt: data.isSinglePrompt,
      dailyDebriefId: data.dailyDebriefId,
    };
    return this.http.post(environment.generateContentPDFUrl, body);
  }

  getSignedPdfUrl(data: any): Observable<Object> {
    let params = new HttpParams()
      .set(
        'eventId',
        data.eventId || this._backendApiService.getCurrentEventName()
      )
      .set('reportType', data.reportType)
      .set('version', data.version)
      .set('promptVersion', data.promptVersion);

    // Only add sessionId if it exists in data
    if (data.sessionId) {
      params = params.set('sessionId', data.sessionId);
    }

    // Only add sessionType if it exists in data
    if (data.sessionType) {
      params = params.set('sessionType', data.sessionType);
    }

    // Only add contentIdentifier if it exists in data
    if (data.briefId) {
      params = params.set('briefId', data.briefId);
    }

    return this.http.get(environment.getPreSignedPDFUrl, { params });
  }

  publishPdfReport(data: any): Observable<Object> {
    const body = {
      eventId: data.eventId || this._backendApiService.getCurrentEventName(),
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
    return this.http.post(environment.generateContentUrl, body);
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

  getSessionsForEvent(eventIdentifier: string): Observable<Object> {
    // TODO: Replace with actual API endpoint when available
    // This is a placeholder method that should be updated with the correct endpoint
    const body = {
      event: eventIdentifier,
    };
    // For now, using getEventDetails as a placeholder
    // Replace this with the actual sessions endpoint when available
    return this.http.post(
      environment.getEventDetails || environment.updateAgendaUrl,
      body
    );
  }

  getEventReportDetails(
    eventName: string,
    registrationId: string = ''
  ): Observable<Object> {
    const headers = new HttpHeaders({
      'x-api-key': environment.X_API_KEY || '',
      'x-user-session': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      'Content-Type': 'application/json',
    });

    const body = {
      eventName: eventName,
      registrationId: registrationId,
    };

    return this.http.post(environment.getEventReportDetails, body, { headers });
  }

  truncateSpeakerBio(
    eventName: string,
    sessionIds: string[]
  ): Observable<Object> {
  

    const body = {
      eventName: eventName,
      sessionIds: sessionIds,
    };

    return this.http.post(environment.truncateSpeakerBioUrl, body);
  }
}

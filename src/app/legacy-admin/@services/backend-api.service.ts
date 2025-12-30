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
    // Get eventName from the first session in the data array
    const eventName = data && data.length > 0 && data[0].Event 
      ? data[0].Event 
      : this._backendApiService.getCurrentEventName();
    
    const body = {
      clearCurrentEvents: false,
      timeZoneUpdate: timezone,
      eventName: eventName,
      eventDetails: data,
    };
    return this.http.post(environment.updateAgendaUrl, body);
  }

  getVersionContent(data: any): Observable<Object> {
    let params = new HttpParams()
      .set(
        'eventId',
        data.eventId || this._backendApiService.getCurrentEventName()
      )
      .set('reportType', data.reportType)
      .set('version', data.version);

    // For session debrief, use sessionId and sessionType
    if (data.sessionId) {
      params = params.set('sessionId', data.sessionId);
    }
    if (data.sessionType) {
      params = params.set('sessionType', data.sessionType);
    }

    // For daily/track debrief, use briefId
    if (data.eventDay) {
      params = params.set('eventDay', data.eventDay);
    }

    if (data.track) {
      params = params.set('track', data.track);
    }

    // For executive_summary, use briefId
    if (data.briefId) {
      params = params.set('briefId', data.briefId);
    }

    return this.http.get(environment.getVersionContentUrl, { params });
  }

  saveEditedVersionContent(data: any): Observable<Object> {
    const body: any = {
      eventId: data.eventId || this._backendApiService.getCurrentEventName(),
      reportType: data.reportType,
      version: data.version,
      updatedContent: data.updatedContent,
    };

    // For daily_debrief, track_debrief, and executive_summary, use eventDay/track/briefId instead of sessionId/sessionType
    if (
      data.reportType === 'daily_debrief' ||
      data.reportType === 'track_debrief' ||
      data.reportType === 'executive_summary'
    ) {
      if (data.reportType === 'daily_debrief' && data.eventDay) {
        body.eventDay = data.eventDay;
      } else if (data.reportType === 'track_debrief' && data.track) {
        body.track = data.track;
      } else if (data.reportType === 'executive_summary' && data.briefId) {
        body.briefId = data.briefId;
      }
    } else {
      // For other report types, sessionId and sessionType are required
      body.sessionId = data.sessionId;
      body.sessionType = data.sessionType;
    }

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

  /**
   * Publishes a debrief report (daily_debrief, track_debrief, or executive_summary).
   * @param {Object} data - The request data for publishing debrief report
   * @param {string} data.reportType - The report type: 'daily_debrief', 'track_debrief', or 'executive_summary'
   * @param {string} data.contentIdentifier - The content identifier (format: "EventId|Identifier")
   * @param {number} data.version - The version number
   * @returns {Observable<Object>} Observable of the API response
   */
  publishDebriefReport(data: {
    reportType: string;
    contentIdentifier: string;
    version: number;
  }): Observable<Object> {
    const headers = new HttpHeaders({
      'x-api-key': environment.X_API_KEY || '',
      'x-user-session': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      'Content-Type': 'application/json',
    });

    const body = {
      reportType: data.reportType,
      contentIdentifier: data.contentIdentifier,
      version: data.version,
    };

    // Use the same base URL pattern as other report generation endpoints
    // Replace the endpoint path while keeping the base URL
    let apiUrl = environment.publishContentPDFUrl;
    if (apiUrl && apiUrl.includes('/publish-pdf-content')) {
      apiUrl = apiUrl.replace(
        '/publish-pdf-content',
        '/publish-debrief-reports'
      );
    } else {
      // Fallback: construct URL from base pattern
      const baseUrl =
        environment.publishContentPDFUrl?.split('/').slice(0, -1).join('/') ||
        'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev';
      apiUrl = `${baseUrl}/publish-debrief-reports`;
    }

    return this.http.post(apiUrl, body, { headers });
  }

  /**
   * Uploads a manual executive summary PDF file via Lambda (avoids CORS issues).
   * @param {string} eventId - The event identifier
   * @param {File} file - The PDF file to upload
   * @returns {Observable<Object>} Observable of the API response
   */
  uploadManualExecutiveSummary(
    eventId: string,
    file: File
  ): Observable<Object> {
    const headers = new HttpHeaders({
      'x-api-key': environment.X_API_KEY || '',
      'x-user-session': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      // Don't set Content-Type - let browser set it with boundary for multipart
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);

    return this.http.post(
      environment.uploadManualExecutiveSummaryUrl,
      formData,
      { headers }
    );
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

  /**
   * Deletes a session/event with S3 backup.
   * @param {string} eventName - The event name
   * @param {string} sessionId - The session ID to delete
   * @returns {Observable<Object>} Observable of the API response
   */
  deleteEvent(eventName: string, sessionId: string): Observable<Object> {
    const headers = new HttpHeaders({
      'x-api-key': environment.X_API_KEY || '',
      'x-user-session': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      'Content-Type': 'application/json',
    });

    const body = {
      event: eventName,
      sessionId: sessionId,
    };

    return this.http.post(environment.deleteEventUrl, body, { headers });
  }

  /**
   * Generates a daily debrief by calling the config API endpoint.
   * @param {Object} data - The request data for generating daily debrief
   * @param {string} data.eventName - The event name/identifier
   * @param {string} data.domain - The domain associated with the event
   * @param {string} data.debriefFilter - The event day filter (e.g., "Day 1", "Day 2")
   * @param {number} [data.screenTimeout=60] - Screen timeout in seconds (default: 60)
   * @returns {Observable<Object>} Observable of the API response
   */
  generateDailyDebrief(data: {
    eventName: string;
    domain: string;
    debriefFilter: string;
    screenTimeout?: number;
  }): Observable<Object> {
    const body = {
      action: 'generateEventDebrief',
      sessionId: '',
      screenTimeout: data.screenTimeout || 60,
      domain: data.domain,
      debriefType: 'DAILY',
      eventName: data.eventName,
      debriefFilter: data.debriefFilter,
    };

    // Use environment variable if available, otherwise use the full URL
    const apiUrl = (environment as any).postData;

    return this.http.post(apiUrl, body);
  }

  /**
   * Generates a track debrief by calling the config API endpoint.
   * @param {Object} data - The request data for generating track debrief
   * @param {string} data.eventName - The event name/identifier
   * @param {string} data.domain - The domain associated with the event
   * @param {string} data.debriefFilter - The track name filter (e.g., "Opening Keynote")
   * @param {number} [data.screenTimeout=60] - Screen timeout in seconds (default: 60)
   * @returns {Observable<Object>} Observable of the API response
   */
  generateTrackDebrief(data: {
    eventName: string;
    domain: string;
    debriefFilter: string;
    screenTimeout?: number;
  }): Observable<Object> {
    const body = {
      action: 'generateEventDebrief',
      sessionId: '',
      screenTimeout: data.screenTimeout || 60,
      domain: data.domain,
      debriefType: 'TRACK',
      eventName: data.eventName,
      debriefFilter: data.debriefFilter,
    };

    // Use environment variable if available, otherwise use the full URL
    const apiUrl = (environment as any).postData;

    return this.http.post(apiUrl, body);
  }

  /**
   * Generates an executive summary by calling the executive summary API endpoint.
   * @param {Object} data - The request data for generating executive summary
   * @param {string} data.event_id - The event identifier
   * @param {string} data.event_title - The event title
   * @param {string} data.executive_summary_id - The executive summary identifier
   * @param {Array} data.reports - Array of report objects with daily_debrief_id and report_type
   * @returns {Observable<Object>} Observable of the API response
   */
  generateExecutiveSummary(data: {
    event_id: string;
    event_title: string;
    executive_summary_id: string;
    reports: Array<{
      daily_debrief_id: string;
      report_type: string;
    }>;
  }): Observable<Object> {
    const headers = new HttpHeaders({
      'x-api-key': environment.X_API_KEY || '',
      'x-user-session': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      'Content-Type': 'application/json',
    });

    const body = {
      event_id: data.event_id,
      event_title: data.event_title,
      executive_summary_id: data.executive_summary_id,
      reports: data.reports,
    };

    // Use environment variable for the API URL
    const apiUrl = (environment as any).executiveSummaryUrl;

    return this.http.post(apiUrl, body, { headers });
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChangeEventStatusRequest,
  ChangeEventStatusResponse,
  EventDetailsResponse,
  EventReportRequestData,
  EventReportResponse,
  UpdatePostInsightsRequest,
  UpdatePostInsightsResponse,
} from 'src/app/insights-editor/data-services/insights-editor.data-model';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InsightsEditorDataService {
  private readonly _http = inject(HttpClient);
  private readonly _backendApiService = inject(LegacyBackendApiService);

  getEventReport(
    requestData: EventReportRequestData
  ): Observable<EventReportResponse> {
    return this._http.post<EventReportResponse>(
      environment.postDebriefData,
      requestData
    );
  }

  changeEventStatus(
    requestData: ChangeEventStatusRequest
  ): Observable<ChangeEventStatusResponse> {
    return this._http.post<ChangeEventStatusResponse>(
      environment.postData,
      requestData
    );
  }

  updatePostInsights(
    requestData: UpdatePostInsightsRequest
  ): Observable<UpdatePostInsightsResponse> {
    return this._http.post<UpdatePostInsightsResponse>(
      environment.postDebriefData,
      requestData
    );
  }

  getEventDetails(): Observable<EventDetailsResponse> {
    return this._http.post<EventDetailsResponse>(environment.getEventDetails, {
      event: this._backendApiService.getCurrentEventName(),
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChangeEventStatusRequest,
  ChangeEventStatusResponse,
  EventReportRequestData,
  EventReportResponse,
  UpdatePostInsightsRequest,
  UpdatePostInsightsResponse,
} from 'src/app/editorial/data-service/editorial.data-model';
import { BackendApiService as LegacyBackendApiService } from 'src/app/legacy-admin/services/backend-api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EditorialDataService {
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

  getEventDetails(): Observable<Object> {
    return this._http.post(environment.getEventDetails, {
      event: this._backendApiService.getCurrentEventName(),
    });
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AnalyticsData,
  AnalyticsRequest,
} from 'src/app/legacy-admin/@data-services/analytics/analytics-data.model';
import {
  getDefaultEndDate,
  getDefaultStartDate,
} from 'src/app/legacy-admin/@utils/data-utils';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsDataService {
  private _backendApiService = inject(LegacyBackendApiService);
  private _http = inject(HttpClient);
  private _apiEndpoint = environment.analyticsApiEndpoint || '/api/analytics';

  getAnalyticsData(
    params: Partial<AnalyticsRequest>
  ): Observable<{ success: boolean; data: AnalyticsData }> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });

    const eventName = this._backendApiService.getCurrentEventName();

    const defaultRequest: AnalyticsRequest = {
      action: 'ALL',
      eventName,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
      page: 1,
      limit: 10,
    };

    const request = { ...defaultRequest, ...params };

    return this._http.post<{ success: boolean; data: AnalyticsData }>(
      this._apiEndpoint,
      request,
      { headers }
    );
  }

  exportAnalyticsData(
    params: Partial<AnalyticsRequest>,
    format: 'pdf' | 'csv'
  ): Observable<Blob> {
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });

    const eventName = this._backendApiService.getCurrentEventName();

    const defaultRequest: AnalyticsRequest = {
      action: 'EXPORT',
      eventName,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
      page: 1,
      limit: 50,
    };

    const request = { ...defaultRequest, ...params, format };

    return this._http.post(`${this._apiEndpoint}/export`, request, {
      headers,
      responseType: 'blob',
    });
  }

  exportReport(startDate: string, endDate: string): Observable<Blob> {
    const eventName = this._backendApiService.getCurrentEventName();
    const refreshToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'X-Api-Key': environment.X_API_KEY,
    });
    if (!eventName) {
      throw new Error('No event selected');
    }

    const payload = {
      action: 'getSessionsReport',
      eventName,
      startDate: startDate + 'T00:00:00Z',
      endDate: endDate + 'T23:59:59Z',
    };

    return this._http.post(this._apiEndpoint, payload, {
      headers,
      responseType: 'blob',
    });
  }
}

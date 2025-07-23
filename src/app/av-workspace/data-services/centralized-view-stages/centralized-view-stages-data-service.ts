import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CentralizedViewStagesRequestData,
  CentralizedViewStagesResponseData,
  StageAutoAVRequestData,
  StageAutoAVResponseData,
  StageSessionActionRequestData,
  StageSessionActionResponseData,
  StageSessionsRequestData,
  StageSessionsResponseData,
} from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CentralizedViewStagesDataService {
  private readonly _httpClient = inject(HttpClient);

  getEventStages(
    requestData: CentralizedViewStagesRequestData
  ): Observable<CentralizedViewStagesResponseData> {
    return this._httpClient.post<CentralizedViewStagesResponseData>(
      `${environment.apiBaseUrl}/r2/stage`,
      requestData
    );
  }

  getStageSessions(
    requestData: StageSessionsRequestData
  ): Observable<StageSessionsResponseData> {
    return this._httpClient.post<StageSessionsResponseData>(
      `${environment.apiBaseUrl}/r2/stage`,
      requestData
    );
  }

  startListeningSession(
    requestData: StageSessionActionRequestData
  ): Observable<StageSessionActionResponseData> {
    return this._httpClient.post<StageSessionActionResponseData>(
      `${environment.apiBaseUrl}/r3/manage-av`,
      requestData
    );
  }

  pauseListeningSession(
    requestData: StageSessionActionRequestData
  ): Observable<StageSessionActionResponseData> {
    return this._httpClient.post<StageSessionActionResponseData>(
      `${environment.apiBaseUrl}/r3/manage-av`,
      requestData
    );
  }

  endListeningSession(
    requestData: StageSessionActionRequestData
  ): Observable<StageSessionActionResponseData> {
    return this._httpClient.post<StageSessionActionResponseData>(
      `${environment.apiBaseUrl}/r3/manage-av`,
      requestData
    );
  }

  setAutoAvStage(
    requestData: StageAutoAVRequestData
  ): Observable<StageAutoAVResponseData> {
    return this._httpClient.post<StageAutoAVResponseData>(
      `${environment.apiBaseUrl}/r3/manage-av`,
      requestData
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EventStagesRequestData,
  EventStagesResponseData,
} from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EventStagesDataService {
  private readonly _httpClient = inject(HttpClient);

  getEventStages(
    requestData: EventStagesRequestData
  ): Observable<EventStagesResponseData> {
    return this._httpClient.post<EventStagesResponseData>(
      `${environment.apiBaseUrl}/r2/stage`,
      requestData
    );
  }
}

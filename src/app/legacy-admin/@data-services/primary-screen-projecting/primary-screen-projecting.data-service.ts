import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SetPrimaryScreenProjectingResponse } from './primary-screen-projecting.data-model';

@Injectable({ providedIn: 'root' })
export class PrimaryScreenProjectingDataService {
  constructor(private _http: HttpClient) {}

  setPrimaryScreenProjecting(
    action: string,
    eventName: string,
    isProjecting: boolean,
    stage: string
  ): Observable<SetPrimaryScreenProjectingResponse> {
    return this._http.post<SetPrimaryScreenProjectingResponse>(
      environment.setAutoAvSetupUrl,
      {
        action,
        eventName,
        isProjecting,
        stage,
      }
    );
  }
}

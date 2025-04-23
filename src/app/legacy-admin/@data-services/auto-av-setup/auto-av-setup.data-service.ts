import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AutoAvSetupRequest,
  AutoAvSetupResponse,
} from 'src/app/legacy-admin/@data-services/auto-av-setup/auto-av-setup.data-model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AutoAvSetupDataService {
  private readonly _http = inject(HttpClient);

  setAutoAvSetup(
    requestData: AutoAvSetupRequest
  ): Observable<AutoAvSetupResponse> {
    return this._http.post<AutoAvSetupResponse>(
      environment.setAutoAvSetupUrl,
      requestData
    );
  }
}

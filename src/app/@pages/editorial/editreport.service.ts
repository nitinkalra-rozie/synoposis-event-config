import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EditReportService {
  constructor(private http: HttpClient) {}

  private _baseUrl = '/events-api'; // https://rozishrddevdus1webeus1.azurewebsites.net
  private _eventsDetailsApi = '/event-details-api';
  private _apiUrl = this._baseUrl + ''; // Replace with your API URL
  private _token;

  sendEmailReport(page_size: string = '10'): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this._token,
    });

    const data = {
      action: 'emailTranscriptReport',
      sessionId: 'day2_session2',
      email: 'dinuka@rozie.ai',
    };
    // Pass the headers and the body as arguments to the post() method
    return this.http.post(this._apiUrl, data, { headers: httpHeaders });
  }

  getEventReport(selected_session: string): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this._token,
    });
    const data = {
      action: 'get_summary_of_Single_Keynote',
      sessionId: [selected_session],
    };
    // Pass the headers and the body as arguments to the post() method
    return this.http.post(this._apiUrl, data, { headers: httpHeaders });
  }

  updateEventReport(): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this._token,
    });

    const data = {
      action: 'emailTranscriptReport',
      sessionId: 'day2_session2',
      email: 'dinuka@rozie.ai',
    };
    // Pass the headers and the body as arguments to the post() method
    return this.http.post(this._apiUrl, data, { headers: httpHeaders });
  }

  getEventDetails(eventName: string): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this._token,
    });
    const data = {
      event: eventName,
    };
    // Pass the headers and the body as arguments to the post() method
    return this.http.post(this._eventsDetailsApi, data, {
      headers: httpHeaders,
    });
  }

  postEditedDebrief(eventName: string): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'application-id': 'application_610e636b-5f8a-443d-a0be-3df7a3b2dce4', // Replace with your actual auth token or other headers
      Authorization: 'Bearer ' + this._token,
    });
    const data = {
      event: eventName,
    };
    // Pass the headers and the body as arguments to the post() method
    return this.http.post(this._eventsDetailsApi, data, {
      headers: httpHeaders,
    });
  }
}

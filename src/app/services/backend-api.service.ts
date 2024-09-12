import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PostData } from '../shared/types';

@Injectable({
  providedIn: 'root',
})
export class BackendApiService {
  constructor(private http: HttpClient) {}
  currentSessionId: string = '';
  eventDay: string = '';
  eventName: string = '';
  domain: string = '';

  getTranscriberPreSignedUrl(body: any) {
    const refreshToken = localStorage.getItem('idToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    return this.http.post(environment.getTranscriberPreSignedUrl, body, { headers: headers });
  }

  putTranscript(transcript: any) {
    const refreshToken = localStorage.getItem('idToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
      primarySessionId: localStorage.getItem('currentPrimarySessionId'),
      transcript: transcript,
      eventName: localStorage.getItem('selectedEvent'),
      domain: localStorage.getItem('domain'),
    };
    return this.http.post(environment.putTranscript, body, { headers: headers });
  }
  // action:any,sessionId:any,flag:any,day:any, data?:any,sessionTitle?:any,theme?:any, eventName?:any, domain?:any
  postData(data: PostData) {
    const refreshToken = localStorage.getItem('idToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    let body = {
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
    };
    if (data.action === 'realTimeInsights') {
      body.keyNoteData = {};
      body.transcript = data.transcript;
    }
    return this.http.post(environment.postData, body, { headers: headers });
  }
  getEventDetails() {
    const refreshToken = localStorage.getItem('idToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    return this.http.post(environment.getEventDetails, { event: environment.eventName }, { headers: headers });
  }
  postCurrentSessionId(sessionId: any, eventName: any, domain: any, primarySessionId: any) {
    const refreshToken = localStorage.getItem('idToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
    });
    console.log('Inside postCurrent', sessionId);
    const body = {
      sessionId: sessionId,
      eventName: eventName,
      domain: domain,
      primarySessionId: primarySessionId,
    };
    return this.http.post(environment.postCurrentSessionId, body, { headers: headers });
  }
}

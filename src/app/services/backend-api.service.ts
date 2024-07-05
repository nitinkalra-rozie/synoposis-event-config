import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  constructor(private http: HttpClient) { }
  currentSessionId:string='';
  eventDay:string='';
  eventName:string='';
  domain:string='';
  


  getTranscriberPreSignedUrl(body:any){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    return this.http.post(environment.getTranscriberPreSignedUrl, body,{ headers: headers });
  }

  putTranscript(transcript:any){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
      Transcript: transcript,
      eventName: localStorage.getItem('eventName'),
      domain: localStorage.getItem('domain')
    }
    return this.http.post(environment.putTranscript, body, { headers: headers });
  }
  postData(action:any,sessionId:any,flag:any,day:any, data?:any,sessionTitle?:any,theme?:any, eventName?:any, domain?:any ){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    let body={
      action:action,
      sessionId: sessionId || localStorage.getItem('currentSessionId'),
      eventName: eventName || localStorage.getItem('eventName'),
      domain:domain || localStorage.getItem('domain'),

      flag:flag,
      day: day || localStorage.getItem('currentDay'),
      keyNoteData: data || {},
      transcript: '',
      screenTimeout: parseInt(localStorage.getItem('postInsideInterval')) || 15,
      sessionTitle: sessionTitle || '',
      theme:theme
    }
    if(action === 'realTimeInsights'){
      body.keyNoteData = {}
      body.transcript = data
    }
    return this.http.post(environment.postData, body,{ headers: headers });
  }
  getEventDetails(){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    return this.http.post(environment.getEventDetails,{},{ headers: headers });
  }
  postCurrentSessionId(sessionId:any,  eventName:any, domain:any){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    console.log("Inside postCurrent", sessionId)
    const body={
      sessionId: sessionId,
      eventName: eventName,
      domain: domain

    }
    return this.http.post(environment.postCurrentSessionId, body,{ headers: headers });
  }
}

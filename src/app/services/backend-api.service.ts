import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.dev';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  constructor(private http: HttpClient) { }
  currentSessionId:string='';
  eventDay:string='';


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
      Transcript: transcript
    }
    return this.http.post(environment.putTranscript, body, { headers: headers });
  }
  postData(action:any,sessionId:any,flag:any,day:any, data?:any){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    const body={
      action:action,
      sessionId: sessionId || localStorage.getItem('currentSessionId'),
      flag:flag,
      day: day || localStorage.getItem('currentDay'),
      keyNoteData: data || {}
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
  postCurrentSessionId(sessionId:any){
    const refreshToken = localStorage.getItem('Idtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${refreshToken}`
    });
    console.log("Inside postCurrent", sessionId)
    const body={
      sessionId: sessionId
    }
    return this.http.post(environment.postCurrentSessionId, body,{ headers: headers });
  }
}

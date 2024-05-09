import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  constructor(private http: HttpClient) { }
  currentSessionId:string='';
  eventDay:string='';



  getTranscriberPreSignedUrl(body:any){
    return this.http.post(environment.getTranscriberPreSignedUrl, body);
  }

  putTranscript(transcript:any){
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
      Transcript: transcript
    }
    return this.http.post(environment.putTranscript, body);
  }
  postData(action:any,sessionId:any,flag:any,day:any, data?:any){
    const body={
      action:action,
      sessionId: sessionId || localStorage.getItem('currentSessionId'),
      flag:flag,
      day: day || localStorage.getItem('currentDay'),
      keyNoteData: data || {}
    }
    return this.http.post(environment.postData, body);
  }
  getEventDetails(){
    return this.http.post(environment.getEventDetails,{});
  }
  postCurrentSessionId(sessionId:any){
    console.log("Inside postCurrent", sessionId)
    const body={
      sessionId: sessionId
    }
    return this.http.post(environment.postCurrentSessionId, body);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  constructor(private http: HttpClient) { }

  getTranscriberPreSignedUrl(body:any){
    return this.http.post('https://fqbvo8ifm0.execute-api.ca-central-1.amazonaws.com/dev/getPreSignedUrl', body);
  }

  putTranscript(transcript:any){
    const body = {
      sessionId: localStorage.getItem('currentSessionId'),
      Transcript: transcript.Transcript
    }
    return this.http.post('https://4pm6ygxgfl.execute-api.ca-central-1.amazonaws.com/dev/postTranscript', body);
  }
  postData(action:any,sessionId:any,flag:any,day:any, data?:any){
    const body={
      action:action,
      sessionId: sessionId || localStorage.getItem('currentSessionId'),
      flag:flag,
      day: day || localStorage.getItem('currentDay'),
      keyNoteData: data || {}
    }
    return this.http.post('https://4pm6ygxgfl.execute-api.ca-central-1.amazonaws.com/dev/adminapplambdaconfig', body);
  }
  getEventDetails(){
    return this.http.post('https://dcbdtg2n1a.execute-api.ca-central-1.amazonaws.com/dev/getEventDetails',{});
  }
  postCurrentSessionId(sessionId:any){
    console.log("Inside postCurrent", sessionId)
    const body={
      sessionId: sessionId
    }
    return this.http.post('https://ukm31jyh2f.execute-api.ca-central-1.amazonaws.com/dev/getCurrentSessionDetails', body);
  }
}

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
      sessionId:"test",
      Transcript: transcript.Transcript
    }
    return this.http.post('https://xmvv5lp42m.execute-api.ca-central-1.amazonaws.com/dev/postTranscript', body);
  }
  postData(action:any,sessionId:any,flag:any,day:any){
    const body={
      action:action,
      sessionId:sessionId,
      flag:flag,
      day:day
    }
    return this.http.post('https://4pm6ygxgfl.execute-api.ca-central-1.amazonaws.com/dev/adminapplambdaconfig', body);
  }
 
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AudioRecorderResponse,
  SessionAudioChunk,
} from 'src/app/legacy-admin/@data-services/audio-recorder/audio-recorder.data-model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AudioRecorderDataService {
  private readonly _http = inject(HttpClient);

  uploadAudioChunk(data: SessionAudioChunk): Observable<AudioRecorderResponse> {
    const body: SessionAudioChunk = {
      sessionId: data.sessionId,
      eventName: data.eventName,
      chunkBase64: data.chunkBase64,
      timestamp: data.timestamp,
      stage: data.stage,
    };
    return this._http.post(environment.audioRecorderUrl, body);
  }
}

import { Component } from '@angular/core';
import {
  downSampleBuffer,
  pcmEncode,
} from 'src/app/legacy-admin/helpers/audioUtils';
declare const Buffer;
// TODO: use @smithy/eventstream-codec instead of @aws-sdk/eventstream-marshaller.
// Check - https://www.npmjs.com/package/@aws-sdk/eventstream-marshaller and https://www.npmjs.com/package/@aws-sdk/eventstream-codec
import * as marshaller from '@aws-sdk/eventstream-marshaller'; // for converting binary event stream messages to and from JSON
// TODO: use @smithy/util-utf8 instead of @aws-sdk/util-utf8-node.
// Check - https://www.npmjs.com/package/@aws-sdk/util-utf8-node and https://www.npmjs.com/package/@aws-sdk/util-utf8
import * as util_utf8_node from '@aws-sdk/util-utf8-node'; // utilities for encoding and decoding UTF8
// TODO: Consider replacing microphone-stream with Web Audio API, Recorder.js or MediaRecorder API
import { escape } from 'lodash-es';
import MicrophoneStream from 'microphone-stream'; // collect microphone input as a stream of raw bytes
import { generateSHA256HashHex } from 'src/app/legacy-admin/@utils/generate-hash';
import { LegacyBackendApiService } from 'src/app/legacy-admin/services/legacy-backend-api.service';

// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);

@Component({
  selector: 'app-audio-streamer',
  templateUrl: './audio-streamer.component.html',
  styleUrls: ['./audio-streamer.component.scss'],
  standalone: true,
})
export class AudioStreamerComponent {
  title = 'AngularTranscribe';
  languageCode = 'en-US';
  region = 'us-east-1';
  sampleRate = 44100;
  transcription = '';
  socket;
  micStream;
  socketError = false;
  transcribeException = false;
  errorText: '';
  isStreaming = false;
  constructor(private backendApiService: LegacyBackendApiService) {}
  startRecording() {
    this.isStreaming = !this.isStreaming;
    console.log('recording');
    window.navigator.mediaDevices
      .getUserMedia({
        video: false,
        audio: true,
      })

      // ...then we convert the mic stream to binary event stream messages when the promise resolves
      .then(this.streamAudioToWebSocket)
      .catch(function (error) {
        console.log(
          'There was an error streaming your audio to Amazon Transcribe. Please try again.',
          error
        );
      });
  }
  streamAudioToWebSocket = (userMediaStream) => {
    //let's get the mic input from the browser, via the microphone-stream module
    console.log('start streamAudioToWebSocket');
    this.micStream = new MicrophoneStream();
    this.micStream.setStream(userMediaStream);
    console.log('start streamAudioToWebSocket22222');
    // Pre-signed URLs are a way to authenticate a request (or WebSocket connection, in this case)
    // via Query Parameters. Learn more: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
    this.createPresignedUrlNew();
    console.log('start streamAudioToWebSocket333333');
  };

  openWebsocketAndStartStream(preSignedUrl: any) {
    console.log('inside openWebsocketAndStartStream', preSignedUrl);
    //open up our WebSocket connection
    this.socket = new WebSocket(preSignedUrl);
    this.socket.binaryType = 'arraybuffer';
    console.log('start streamAudioToWebSocket44444');
    // when we get audio data from the mic, send it to the WebSocket if possible
    this.socket.onopen = () => {
      this.micStream.on('data', (rawAudioChunk) => {
        // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
        const binary = this.convertAudioToBinaryMessage(rawAudioChunk);

        if (this.socket.OPEN) this.socket.send(binary);
      });
    };
    console.log('start streamAudioToWebSocket5555');
    // handle messages, errors, and close events
    this.wireSocketEvents();
  }
  createPresignedUrlNew = async () => {
    const body = {
      method: 'GET',
      endpoint: 'transcribestreaming.' + this.region + '.amazonaws.com:8443',
      path: '/stream-transcription-websocket',
      service: 'transcribe',
      hash: await generateSHA256HashHex(''),
      options: {
        key: 'AKIA3SVZJVX56UU2YEWT',
        secret: '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',
        protocol: 'wss',
        expires: 15,
        region: 'us-east-1',
        query:
          'language-code=' +
          this.languageCode +
          '&media-encoding=pcm&sample-rate=' +
          this.sampleRate,
      },
    };
    await this.backendApiService
      .getTranscriberPreSignedUrl(body)
      .subscribe((data: any) => {
        console.log('inside  createPresignedUrlNew', JSON.stringify(data));
        const url = data.data;
        this.openWebsocketAndStartStream(url);
      });
    // let endpoint = 'transcribestreaming.' + this.region + '.amazonaws.com:8443';
    // console.log('start createPresignedUrlNew start '+ endpoint );
    // // get a preauthenticated URL that we can use to establish our WebSocket
    // return createPresignedURL(
    //   'GET',
    //   endpoint,
    //   '/stream-transcription-websocket',
    //   'transcribe',
    //   createHash('sha256').update('', 'utf8').digest('hex'),
    //   {
    //     key: 'AKIA3SVZJVX56UU2YEWT',
    //     secret: '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',
    //     protocol: 'wss',
    //     expires: 15,
    //     region: 'us-east-1',
    //     query:
    //       'language-code=' +
    //       this.languageCode +
    //       '&media-encoding=pcm&sample-rate=' +
    //       this.sampleRate
    //   }
    // );
  };
  getAudioEventMessage = (buffer) =>
    // wrap the audio data in a JSON envelope
    ({
      headers: {
        ':message-type': {
          type: 'string',
          value: 'event',
        },
        ':event-type': {
          type: 'string',
          value: 'AudioEvent',
        },
      },
      body: buffer,
    });
  convertAudioToBinaryMessage = (audioChunk) => {
    const raw = MicrophoneStream.toRaw(audioChunk);

    if (raw === null) return null;

    // down sample and convert the raw audio bytes to PCM
    const downSampledBuffer = downSampleBuffer(raw, this.sampleRate);
    const pcmEncodedBuffer = pcmEncode(downSampledBuffer);

    // add the right JSON headers and structure to the message
    const audioEventMessage = this.getAudioEventMessage(
      Buffer.from(pcmEncodedBuffer)
    );

    //convert the JSON object + headers into a binary event stream message
    // @ts-ignore
    const binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
  };
  closeSocket = () => {
    this.isStreaming = !this.isStreaming;
    if (this.socket.OPEN) {
      this.micStream.stop();

      // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
      const emptyMessage = this.getAudioEventMessage(new Uint8Array(0));
      // @ts-ignore
      const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
      this.socket.send(emptyBuffer);
    }
  };
  handleEventStreamMessage = (messageJson) => {
    const results = messageJson.Transcript.Results;
    console.log(
      'messageJSON got from the transcribe',
      JSON.stringify(messageJson)
    );
    if (results.length > 0) {
      if (results[0].Alternatives.length > 0) {
        let transcript = results[0].Alternatives[0].Transcript;

        // fix encoding for accented characters
        transcript = decodeURIComponent(escape(transcript));

        // update the textarea with the latest result
        console.log('transcript', transcript);

        // if this transcript segment is final, add it to the overall transcription
        if (!results[0].IsPartial) {
          //scroll the textarea down
          this.transcription = transcript;
          // this.transcription += transcript + '\n';
          this.backendApiService
            .putTranscript(messageJson)
            .subscribe((data: any) => {
              console.log(data);
            });
        }
      }
    }
  };
  wireSocketEvents = () => {
    // handle inbound messages from Amazon Transcribe
    this.socket.onmessage = (message) => {
      //convert the binary event stream message to JSON
      const messageWrapper = eventStreamMarshaller.unmarshall(
        Buffer(message.data)
      );
      const messageBody = JSON.parse(
        String.fromCharCode.apply(String, messageWrapper.body)
      );
      if (messageWrapper.headers[':message-type'].value === 'event') {
        this.handleEventStreamMessage(messageBody);
      } else {
        this.transcribeException = true;
        console.log(messageBody.Message);
        // toggleStartStop();
      }
    };

    this.socket.onerror = function () {
      this.socketError = true;
      console.log('WebSocket connection error. Try again.');
      // toggleStartStop();
    };

    this.socket.onclose = (closeEvent) => {
      this.micStream.stop();

      // the close event immediately follows the error event; only handle one.
      if (!this.socketError && !this.transcribeException) {
        if (closeEvent.code != 1000) {
          console.log('error' + closeEvent.reason);
        }
        // toggleStartStop();
      }
    };
  };
}

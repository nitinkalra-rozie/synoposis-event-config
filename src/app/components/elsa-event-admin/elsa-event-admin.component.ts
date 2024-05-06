import { Component } from '@angular/core';
import { BackendApiService } from 'src/app/services/backend-api.service';
import { CognitoService } from 'src/app/services/cognito.service';
declare const Buffer;
import { pcmEncode, downsampleBuffer } from '../../helpers/audioUtils';
import * as createHash from 'create-hash';
import * as marshaller from '@aws-sdk/eventstream-marshaller'; // for converting binary event stream messages to and from JSON
import * as util_utf8_node from '@aws-sdk/util-utf8-node'; // utilities for encoding and decoding UTF8
import MicrophoneStream from 'microphone-stream'; // collect microphone input as a stream of raw bytes
// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);
@Component({
  selector: 'app-elsa-event-admin',
  templateUrl: './elsa-event-admin.component.html',
  styleUrls: ['./elsa-event-admin.component.css']
})
export class ElsaEventAdminComponent {
  selectedKeynoteType: string = ''; 
  selectedSessionType: string = ''; 
  selectedReportType: string = '';
  selectedDay:string='';
  eventDetails:any = [];
  eventDays: any = [];
  selectedSessionTitle: string = '';
  filteredEventData:any = [];
  //*************************************
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
  //***************************************

  constructor(private backendApiService: BackendApiService,private cognitoService:CognitoService ) { }

  ngOnInit(): void {
    this.showWelcomeMessageBanner(); 
    this.showSnapshot();
    this.showThankYouScreen();
    this.getEventDetails();
    this.selectedDay = localStorage.getItem('currentDay') ||'';
    this.selectedSessionTitle = localStorage.getItem('currentSessionTitle') ||'';
    if(this.selectedDay){

    }
  }

  showWelcomeMessageBanner(): void {
    this.backendApiService.postData('welcome','', 'welcome_flag', this.selectedDay);
  }

  showSnapshot(): void {
    this.backendApiService.postData('snapshot','', 'snapshot_flag', this.selectedDay);
  }

  showThankYouScreen(): void {
    this.backendApiService.postData('thank_you','','thank_flag', this.selectedDay);
  }

  showSummary(): void {
    // Check if a keynote type is selected
    if (this.selectedKeynoteType) {
      // Call the appropriate Lambda function based on the selected keynote type
      switch (this.selectedKeynoteType) {
        case 'single':  
          this.backendApiService.postData('summary_of_Single_Keynote','', 'summary_of_Single_Keynote_flag', this.selectedDay);
          break;
        case 'multiple':
          this.backendApiService.postData('summary_of_multiple_Keynot','', 'summary_of_multiple_Keynote_flag', this.selectedDay);
          break;
        case 'combination':
          this.backendApiService.postData('summary_combination','', 'summary_combination_flag', this.selectedDay);
          break;
        default:
          console.error('No keynote type selected');
          break;
      }
    } else {
      console.error('No keynote type selected');
    }
  }

  selectOption(option: string): void {
    this.selectedKeynoteType = option;
    this.showSummary();
  }

  showSession(): void {
   
    if (this.selectedSessionType) {
    
      switch (this.selectedSessionType) {
        case 'single':
        
          this.backendApiService.postData('snapshot_of_Single_Keynote','', 'snapshot_of_Single_Keynote_flag', this.selectedDay);
          break;
        case 'multiple':
       
          this.backendApiService.postData('snapshot_of_multiple_Keynote','', 'snapshot_of_multiple_Keynote_flag', this.selectedDay);
          break;
        case 'combination':
        
          this.backendApiService.postData('snapshot_combination','', 'snapshot_combination_flag', this.selectedDay);
          break;
        default:
        
          console.error('No session type selected');
          break;
      }
    } else {
      console.error('No session type selected');
    }
  }

  selectSession(option: string): void {
    console.log('Selected session option:', option);
    this.selectedSessionType = option;
    this.showSession();
  }

  showReports(): void {
   
    if (this.selectedReportType) {
    
      switch (this.selectedReportType) {
        case 'each_keynote': 
          this.backendApiService.postData('report_of_Single_Keynote','', 'report_of_Single_Keynote_flag', this.selectedDay);
          break;
        case 'multiple_keynotes':  
          this.backendApiService.postData('report_of_multiple_Keynote','', 'report_of_multiple_Keynote_flag', this.selectedDay);
          break;
        case 'combination':
          this.backendApiService.postData('report_combination','', 'report_combination_flag', this.selectedDay);
          break;
        default:
   
          console.error('No report type selected');
          break;
      }
    } else {
      console.error('No report type selected');
    }
  }

  selectReport(option: string): void {
    console.log('Selected report option:', option);
    this.selectedReportType = option;
    this.showReports();
  }

  showEndSession(): void {
 
    this.backendApiService.postData('End_seasion','', 'trigger_post_insights', this.selectedDay);
  }
  selectDay(day:string){
    this. selectedDay=day;

  }
  getEventDetails(){
    this.backendApiService.getEventDetails().subscribe((data:any)=>{
      console.log("event details are as follows",data);
      this.eventDetails = data;
      this.filteredEventData = this.eventDetails;
      this.eventDays = [];
      data.forEach((event: { EventDay: any; }) => {
        if (!this.eventDays.includes(event.EventDay)) {
          this.eventDays.push(event.EventDay);
        }
      });
    })
  }

  onDayChange() {
    if (this.selectedDay !== '') {
      this.filteredEventData = this.eventDetails.filter(event => event.EventDay === this.selectedDay);
    } else {
      this.filteredEventData = this.eventDetails;
    }
  }

  startSession(){
   if(this.selectedDay !== '' && this.selectedSessionTitle !== ''){
    localStorage.setItem("currentSessionTitle",this.selectedSessionTitle);
    const sessionId = this.findSessionId(this.selectedDay, this.selectedSessionTitle);
    localStorage.setItem("currentSessionId",sessionId);
    localStorage.setItem("currentDay", this.selectedDay);
    this.startRecording();
   }
   else{
    alert('Please select the Event Day and Speaker Name to start the session');
   }
  }
  findSessionId(eventDay: string, SessionTitle: string): string | null {
    const session = this.eventDetails.find(session =>
      session.EventDay === eventDay && session.SessionTitle === SessionTitle
    );
    return session ? session.SessionId : null;
  }
  //*************************************** 
  startRecording() {
    this.isStreaming = !this.isStreaming
    console.log('recording');
    window.navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
  })
  
  // ...then we convert the mic stream to binary event stream messages when the promise resolves 
  .then(this.streamAudioToWebSocket) 
  .catch(function (error) {
      console.log('There was an error streaming your audio to Amazon Transcribe. Please try again.', error);
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
   
  }

  openWebsocketAndStartStream(preSignedUrl:any){
    console.log("inside openWebsocketAndStartStream",preSignedUrl);
     //open up our WebSocket connection
     this.socket = new WebSocket(preSignedUrl);
     this.socket.binaryType = 'arraybuffer';
     console.log('start streamAudioToWebSocket44444');
     // when we get audio data from the mic, send it to the WebSocket if possible
     this.socket.onopen = () => {
       this.micStream.on('data', rawAudioChunk => {
         // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
         let binary = this.convertAudioToBinaryMessage(rawAudioChunk);
 
         if (this.socket.OPEN) this.socket.send(binary);
       });
     };
     console.log('start streamAudioToWebSocket5555');
     // handle messages, errors, and close events
     this.wireSocketEvents();
  }
createPresignedUrlNew = async () => {
    let body = {
      method:'GET',
      endpoint: 'transcribestreaming.' + this.region + '.amazonaws.com:8443',
      path: '/stream-transcription-websocket',
      service: 'transcribe',
      hash:createHash('sha256').update('', 'utf8').digest('hex'),
      options:{
        key: 'AKIA3SVZJVX56UU2YEWT',
        secret: '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',
        protocol: 'wss',
        expires: 15,
        region: 'us-east-1',
        query:'language-code=' + this.languageCode + '&media-encoding=pcm&sample-rate=' + this.sampleRate
      }
    }
  await this.backendApiService.getTranscriberPreSignedUrl(body).subscribe((data:any)=>{
      console.log('inside  createPresignedUrlNew', JSON.stringify(data));
      const url = data.data;
      this.openWebsocketAndStartStream(url);
    })
  };
  getAudioEventMessage = (buffer) => {
    // wrap the audio data in a JSON envelope
    return {
      'headers': {
        ':message-type': {
          type: 'string',
          value: 'event'
        },
        ':event-type': {
          type: 'string',
          value: 'AudioEvent'
        }
      },
      body: buffer
    };
  }
  convertAudioToBinaryMessage = (audioChunk) => {
    let raw = MicrophoneStream.toRaw(audioChunk);

    if (raw == null) return;

    // downsample and convert the raw audio bytes to PCM
    let downsampledBuffer = downsampleBuffer(raw, this.sampleRate);
    let pcmEncodedBuffer = pcmEncode(downsampledBuffer);

    // add the right JSON headers and structure to the message
    let audioEventMessage = this.getAudioEventMessage(
      Buffer.from(pcmEncodedBuffer)
    );

    //convert the JSON object + headers into a binary event stream message
    // @ts-ignore
    let binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
  }
  closeSocket = () => {
    this.isStreaming = !this.isStreaming
    if (this.socket.OPEN) {
      this.micStream.stop();

      // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
      let emptyMessage = this.getAudioEventMessage(Buffer.from(new Buffer([])));
      // @ts-ignore
      let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
      this.socket.send(emptyBuffer);
    }
    localStorage.removeItem('currentSessionTitle')
    localStorage.removeItem('currentSessionId')
    localStorage.removeItem('currentDay')
    this.selectedSessionTitle = ''
    this.selectedDay = ''
  }
  handleEventStreamMessage = (messageJson) => {
    let results = messageJson.Transcript.Results;
    console.log("messageJSON got from the transcribe", JSON.stringify(messageJson));
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
          this.transcription = transcript
          // this.transcription += transcript + '\n';
          this.backendApiService.putTranscript(messageJson).subscribe((data:any)=>{
            console.log(data);
          })
        }
      }
    }
  }
  wireSocketEvents = () => {
    // handle inbound messages from Amazon Transcribe
    this.socket.onmessage = message => {
      //convert the binary event stream message to JSON
      let messageWrapper = eventStreamMarshaller.unmarshall(
        Buffer(message.data)
      );
      let messageBody = JSON.parse(
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

    this.socket.onerror = function() {
      this.socketError = true;
      console.log('WebSocket connection error. Try again.');
      // toggleStartStop();
    };

    this.socket.onclose = closeEvent => {
      this.micStream.stop();

      // the close event immediately follows the error event; only handle one.
      if (!this.socketError && !this.transcribeException) {
        if (closeEvent.code != 1000) {
          console.log('error' + closeEvent.reason);
        }
        // toggleStartStop();
      }
    };
  }
  //***************************************
}
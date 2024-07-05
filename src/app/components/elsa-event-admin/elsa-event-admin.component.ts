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
  options: string[] = [];
  selectedOptions: string[] = [];
  dropdownOpen: boolean = false;
  sessionIds=[];
  successMessage: string = '';
  failureMessage: string = '';
  transctiptToInsides: string = '';
  timeoutId: any = '';
  currentSessionId = '';
  postInsideInterval: number = 15;
  transcriptTimeOut: number = 60;
  lastFiveWords: string = '';
  //*************************************
  title = 'AngularTranscribe';
  languageCode = 'en-US';
  region = 'ca-central-1';
  sampleRate = 44100;
  transcription = '';
  socket;
  micStream;
  socketError = false;
  transcribeException = false;
  errorText: '';
  isStreaming = false;
  selectedDomain: string = '';
  // const options = [
  //   "Banking and Finance",
  //   "Healthcare",
  //   "Airline",
  //   "Telecommunications",
  //   "Other",
  // ];
  selectedTheme: string='';
  themeOptions: string[] = ['dark', 'light'];


  domain: string = '';
  borderColor: string = '#000'; // Default border color
  dropdownVisible: boolean = false;
  options_domain: string[] =[
    "Banking and Finance",
    "Healthcare",
    "Airline",
    "Telecommunications",
    "Other",
  ];// Replace with your options
  dropdown: string = 'path-to-dropdown-icon.png';

  eventName:string='';
 

  
  //***************************************

  constructor(private backendApiService: BackendApiService,private cognitoService:CognitoService ) { }

  ngOnInit(): void {
    this.getEventDetails();
    this.selectedDay = localStorage.getItem('currentDay') || '';
    this.selectedSessionTitle = localStorage.getItem('currentSessionTitle') ||'';
    this.currentSessionId = localStorage.getItem('currentSessionId') || '';
    this.transcriptTimeOut = parseInt(localStorage.getItem('transcriptTimeOut')) || 60
    this.postInsideInterval = parseInt(localStorage.getItem('postInsideInterval')) || 15
    this.lastFiveWords=localStorage.getItem('lastFiveWords')
    this.selectedDomain=localStorage.getItem('selectedDomain') || '';
    if(this.selectedDay !== '' && this.selectedSessionTitle !== ''){
        this.startRecording()
        this.transctiptToInsides = localStorage.getItem('transctiptToInsides');
    }
  }
  logout() {
    this.cognitoService.logOut();
  }

  showWelcomeMessageBanner(): void {
    this.backendApiService.postData('welcome', '', 'welcome_flag', this.selectedDay).subscribe(
      (data: any) => {
        this.showSuccessMessage('Welcome message screen sent successfully!');
      },
      (error: any) => {
        this.showFailureMessage('Failed to send welcome message.',error);
      }
    );
  }

  handleDomainChange(event: any) {
    this.domain = event.target.value;
  }


 

  toggleDropdown_domain() {
    this.dropdownVisible = !this.dropdownVisible;
  }

  handleOptionClick(option: string) {
    this.domain = option;
    this.dropdownVisible = false;
  }
  
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000); 
  }

  private showFailureMessage(message: string, error: any): void {
    this.failureMessage = message;
    setTimeout(() => {
      this.failureMessage = '';
    }, 5000); 
  }
  showSnapshot(): void {
    const sessionDetails = this.findSession(this.selectedDay, this.selectedSessionTitle);
    this.backendApiService.postData('snapshot',sessionDetails.SessionId, 'snapshot_flag', this.selectedDay,this.eventName,this.domain).subscribe((data:any)=>{
      this.showSuccessMessage('Snapshot message sent successfully!');
      console.log(data);

    },
    (error: any) => {
      this.showFailureMessage('Failed to send snapshot message.',error);
    });
  }

  showThankYouScreen(): void {
    this.backendApiService.postData('thank_you','','thank_flag', this.selectedDay).subscribe((data:any)=>{
      this.showSuccessMessage('Thank you message sent successfully!');
      console.log(data);
    }, 
    (error: any) => {
      this.showFailureMessage('Failed to send thank you message.',error);
    });
  }
  showEndEvent(){
    this.backendApiService.postData('thank_you','','thank_flag', 'endEvent').subscribe((data:any)=>{
      this.showSuccessMessage('End event message sent successfully!');
      console.log(data);
    }, 
    (error: any) => {
      this.showFailureMessage('Failed to send end event message.',error);
    });
  }
  showBackupScreen():void{
    this.backendApiService.postData('backup_screen','','backup_screen', this.selectedDay).subscribe((data:any)=>{
      this.showSuccessMessage('Backup message sent successfully!');
      console.log(data);
    },
    (error: any) => {
      this.showFailureMessage('Failed to send backup message.',error);
    });
  }
  showQrScreen():void{
    this.backendApiService.postData('qr_screen','','backup_screen', this.selectedDay).subscribe((data:any)=>{
      console.log(data);
      this.showSuccessMessage('Qr message sent successfully!');
    },
    (error: any) => {
      this.showFailureMessage('Failed to send qr message.',error);
    });
  }

  showSummary(): void {
    // Check if a keynote type is selected
     this.sessionIds= [];
    if(this.selectedOptions.length <= 0){
      alert("select the sessions to show the summary!");
      return;
    }else{
      this.selectedOptions.forEach(element => {
        const session =  this.findSession(this.selectedDay, element);
        this.sessionIds.push(session.SessionId);
      });

      this.backendApiService.postData('summary_of_Single_Keynote',this.sessionIds, 'summary_of_Single_Keynote_flag', this.selectedDay,this.eventName,this.domain).subscribe((data:any)=>{
        console.log(data);
        this.showSuccessMessage('Single keynote message sent successfully!');
      },
      (error: any) => {
        this.showFailureMessage('Failed to send single keynote message.',error);
      });
    }
  }

  showSession(): void {
    const sessionDetails = this.findSession(this.selectedDay, this.selectedSessionTitle);
    if (this.selectedSessionType) {
    
      switch (this.selectedSessionType) {
        case 'single':
        
          this.backendApiService.postData('snapshot_of_Single_Keynote',sessionDetails.SessionId, 'snapshot_of_Single_Keynote_flag', this.selectedDay,this.eventName,this.domain);
          break;
        case 'multiple':
       
          this.backendApiService.postData('snapshot_of_multiple_Keynote',sessionDetails.SessionId, 'snapshot_of_multiple_Keynote_flag', this.selectedDay,this.eventName,this.domain);
          break;
        case 'combination':
        
          this.backendApiService.postData('snapshot_combination',sessionDetails.SessionId, 'snapshot_combination_flag', this.selectedDay,this.eventName,this.domain);
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
    const sessionDetails = this.findSession(this.selectedDay, this.selectedSessionTitle);
    if (this.selectedReportType) {
    
      switch (this.selectedReportType) {
        case 'each_keynote': 
          this.backendApiService.postData('report_of_Single_Keynote',sessionDetails.SessionId, 'report_of_Single_Keynote_flag', this.selectedDay,this.eventName,this.domain);
          break;
        case 'multiple_keynotes':  
          this.backendApiService.postData('report_of_multiple_Keynote',sessionDetails.SessionId, 'report_of_multiple_Keynote_flag', this.selectedDay,this.eventName,this.domain);
          break;
        case 'combination':
          this.backendApiService.postData('report_combination',sessionDetails.SessionId, 'report_combination_flag', this.selectedDay,this.eventName,this.domain);
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
    const session = this.findSession(this.selectedDay, this.selectedSessionTitle);
    console.log("sessionId for end session",session)
    if(confirm("Are you sure to end the session?")) {
    this.backendApiService.postData('end_session',session.SessionId, 'trigger_post_insights', this.selectedDay,this.eventName,this.domain,'',session.SessionSubject).subscribe((data:any)=>{
      this.showSuccessMessage('End session message sent successfully!');
      this.showPostInsightsLoading()
    },
    (error: any) => {
      this.showFailureMessage('Failed to send end session message.',error);
    });
    this.closeSocket();
    }
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
    console.log('inside day change',this.selectedDay)
    this.options = [];
    if (this.selectedDay !== '') {
      this.filteredEventData = this.eventDetails.filter(event => event.EventDay === this.selectedDay);
    } else {
      this.filteredEventData = this.eventDetails;
    }
    this.filteredEventData.forEach(element => {
      this.options.push(element.SessionTitle);
    });
    console.log('end of on day change',this.options)
  }

  onThemeChange(){
console.log('theme change', this.selectedTheme);
this.backendApiService.postData('updateTheme','','', '','','',this.selectedTheme).subscribe((data:any)=>{
  console.log(data);
  this.showSuccessMessage(`Theme color is ${this.selectedTheme}`);
},
(error: any) => {
  this.showFailureMessage('Failed to change theme color .',error);
});
  }


  selectDomain(domain: string) {
    this.selectedDomain = domain;
    localStorage.setItem('selectedDomain', domain);
    console.log('Selected domain:', this.selectedDomain);
  }

  startSession(){
   if(this.selectedDay !== '' && this.selectedSessionTitle !== ''){
    localStorage.setItem("currentSessionTitle",this.selectedSessionTitle);
    const session = this.findSession(this.selectedDay, this.selectedSessionTitle);
    localStorage.setItem("currentSessionId",session.SessionId);
    localStorage.setItem("currentDay", this.selectedDay);
    localStorage.setItem("eventName",this.eventName);
    localStorage.setItem("domain",this.domain);
    this.startRecording();
    this.backendApiService.postCurrentSessionId(session.SessionId,this.eventName,this.domain).subscribe((data:any)=>{
      console.log(data);
      this.showSuccessMessage('Start session message sent successfully!');
    },
    (error: any) => {
      this.showFailureMessage('Failed to send start session message.',error);
    });
  
    this.showLoadingInsights()
   }
   else{
    alert('Please select the Event Day and Speaker Name to start the session');
   }
  }
  findSession(eventDay: string, SessionTitle: string){
    const session = this.eventDetails.find((session: { EventDay: string; SessionTitle: string; }) =>
      session.EventDay === eventDay && session.SessionTitle === SessionTitle
    );
    return session ? session : null;
  }

  toggleSelection(option: string) {
    if (this.selectedOptions.includes(option)) {
      this.selectedOptions = this.selectedOptions.filter(item => item !== option);
    } else {
      this.selectedOptions.push(option);
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.onDayChange();
  }

  showKeyNote(){
    if(this.selectedDay != '' && this.selectedSessionTitle != ''){
      const sessionDetails = this.findSession(this.selectedDay, this.selectedSessionTitle);
      this.backendApiService.postData('keynote',sessionDetails.SessionId,'keynote_flag',this.selectedDay,this.eventName,this.domain,sessionDetails).subscribe(()=>{
        this.showSuccessMessage('Show speakers details sent successfully!');
      },
      (error: any) => {
        this.showFailureMessage('Failed to send show speakers details.',error);
      });
    }else{
      alert('Event day and Session should be selected to show speaker details!');
    }
   
  }

  showLoadingInsights(){
    this.backendApiService.postData('insightsLoading','','insightsLoading_flag',this.selectDay|| '').subscribe(()=>{
    });
  }

  showPostInsightsLoading(){
    this.backendApiService.postData('postInsightsLoading','','postInsightsLoading_flag',this.selectDay|| '').subscribe(()=>{
    });
  }

  onSelectSession(){
    this.dropdownOpen
  }

  realtimeInsides(transcript: string) {
    if (this.transctiptToInsides === '') {
        this.setTimerToPushTranscript();
    }
    
    this.transctiptToInsides += transcript;
    localStorage.setItem('transctiptToInsides', this.transctiptToInsides);
    
    const words = this.transctiptToInsides.split(/\s+/);
    const wordCount = words.length;
    
    if (wordCount > 100) {
        // Clear existing timer
        console.log('1 minute 100 completed ')
        this.hitBackendApiAndReset()
    }
}

setTimerToPushTranscript() {
    clearInterval(this.timeoutId)
  console.log('1 minute reset')
    this.timeoutId = setTimeout(() => {
      console.log('1 minute completed')
      this.hitBackendApiAndReset()
    }, this.transcriptTimeOut * 1000 || 60000);
}

hitBackendApiAndReset(){
  this.sendTranscriptToBackend(this.lastFiveWords+" "+this.transctiptToInsides);
  const words = this.transctiptToInsides.split(/\s+/);
  this.lastFiveWords = this.getLastFiveWords(words);
  this.transctiptToInsides = '';
  localStorage.setItem('lastFiveWords',this.lastFiveWords)
  localStorage.setItem('transctiptToInsides', this.transctiptToInsides);
  clearInterval(this.timeoutId);
}
sendTranscriptToBackend(transcript: string) {
    this.getRealTimeInsights(transcript);
}

getLastFiveWords(words: string[]): string {
    return words.slice(-5).join(" ");
}

getRealTimeInsights(transcript: string) {
    this.backendApiService.postData('realTimeInsights', this.currentSessionId, 'realTimeInsights_flag', this.selectedDay,this.eventName,this.domain, transcript).subscribe(() => {
        // Handle success or error if needed
    });
}


  onPostInsideIntervalChange() {
    // This function will be triggered whenever the value of postInsideInterval changes
    console.log("postInsideInterval changed to:", this.postInsideInterval);
    localStorage.setItem("postInsideInterval",this.postInsideInterval.toString())

    // You can call any other functions or perform any other actions here
  }

  onTranscriptTimeOutChange() {
    // This function will be triggered whenever the value of transcriptTimeOut changes
    console.log("transcriptTimeOut changed to:", this.transcriptTimeOut);
    localStorage.setItem("transcriptTimeOut",this.transcriptTimeOut.toString())
    // You can call any other functions or perform any other actions here
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
        protocol: 'wss',
        expires: 15,
        region: 'ca-central-1',
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
      if (this.socket.OPEN) {
        this.micStream.stop();
  
        // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
        let emptyMessage = this.getAudioEventMessage(Buffer.from(new Buffer([])));
        // @ts-ignore
        let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
        this.socket.send(emptyBuffer);
      }
      clearInterval(this.timeoutId);
      localStorage.removeItem('currentSessionTitle')
      localStorage.removeItem('currentSessionId')
      localStorage.removeItem('lastFiveWords')
      this.selectedSessionTitle = ''
      this.transctiptToInsides= '';
      this.isStreaming = !this.isStreaming
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
          this.realtimeInsides(this.transcription);
          this.backendApiService.putTranscript(this.transcription).subscribe((data:any)=>{
            console.log(data);
          },
          (error: any) => {
            this.showFailureMessage('Failed to store transcript',error);
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
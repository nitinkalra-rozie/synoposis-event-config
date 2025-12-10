// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiBaseUrl: 'https://dev.api.synopsis.rozie.ai',
  getTranscriberPreSignedUrl:
    'https://dev.api.synopsis.rozie.ai/r2/getPreSignedUrl',
  putTranscript: 'https://dev.api.synopsis.rozie.ai/r2/postTranscript',
  postData: 'https://dev.api.synopsis.rozie.ai/r2/config',
  postDebriefData: 'https://dev.api.synopsis.rozie.ai/r4/config',
  getEventDetails: 'https://dev.api.synopsis.rozie.ai/r1/getEventDetails',
  getEventReportDetails:
    'https://dev.api.synopsis.rozie.ai/r1/getEventReportDetails',
  truncateSpeakerBioUrl:
    'https://dev.api.synopsis.rozie.ai/r3/truncateSpeakerBio',
  updateAgendaUrl: 'https://dev.api.synopsis.rozie.ai/r5/postEventDetails',
  getUploadFilePresignedUrl: 'https://dev.api.synopsis.rozie.ai/r6/config',
  postCurrentSessionId:
    'https://dev.api.synopsis.rozie.ai/r2/getCurrentSessionDetails',
  getContentVersionsUrl:
    'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev/get-content-versions',
  getVersionContentUrl:
    'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev/get-version-content',
  generateContentPDFUrl:
    'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev/generate-content-pdf',
  publishContentPDFUrl:
    'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev/publish-pdf-content',
  getPreSignedPDFUrl:
    'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev/get-content-pdf',
  generateContentUrl:
    'https://oda3k47th4.execute-api.ca-central-1.amazonaws.com/dev/session-debrief',
  saveEditedVersionContentUrl:
    'https://rrjlcggfma.execute-api.ca-central-1.amazonaws.com/dev/manual-edit-generated-content',
  analyticsApiEndpoint: 'https://dev.api.synopsis.rozie.ai/r5/admin-analytics',
  USER_POOL_WEB_CLIENT_ID: 'ckj0esj3hj5utldceksic8p9f',
  USER_POOL_ID: 'ca-central-1_OQOEfllk7',
  AUTH_API_END_POINT: 'https://cognito-idp.ca-central-1.amazonaws.com',
  REQUEST_ACCESS_API:
    'https://6r1ufmxw01.execute-api.ca-central-1.amazonaws.com/dev/request-access',
  REQUEST_ACCESS_API_KEY: 'wRc0COL6sp6jOC6j2ry2m639O1NUsklH4EFp4xbm',
  X_API_KEY: 'B7YTICPnCP93axNfbqrEH7Bn8V3E3t4i4rtOJmk7',
  wsUrl: 'wss://admin-ws.dev.api.synopsis.rozie.ai/',
  audioRecorderUrl: 'https://dev.api.synopsis.rozie.ai/r2/postAudioChunk',
};

/*
 * In dev mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in prod mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

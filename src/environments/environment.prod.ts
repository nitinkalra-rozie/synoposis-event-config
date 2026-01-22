export const environment = {
  production: true,
  apiBaseUrl: 'https://api.synopsis.rozie.ai',
  getTranscriberPreSignedUrl:
    'https://api.synopsis.rozie.ai/r2/getPreSignedUrl',
  putTranscript: 'https://api.synopsis.rozie.ai/r2/postTranscript',
  postData: 'https://api.synopsis.rozie.ai/r2/config',
  postDebriefData: 'https://api.synopsis.rozie.ai/r4/config',
  getEventDetails: 'https://api.synopsis.rozie.ai/r1/getEventDetails',
  getEventReportDetails:
    'https://api.synopsis.rozie.ai/r1/getEventReportDetails',
  truncateSpeakerBioUrl: 'https://api.synopsis.rozie.ai/r3/truncateSpeakerBio',
  deleteEventUrl: 'https://api.synopsis.rozie.ai/r3/deleteEvent',
  updateAgendaUrl: 'https://api.synopsis.rozie.ai/r5/postEventDetails',
  getUploadFilePresignedUrl: 'https://api.synopsis.rozie.ai/r6/config',
  postCurrentSessionId:
    'https://api.synopsis.rozie.ai/r2/getCurrentSessionDetails',
  getContentVersionsUrl:
    'https://api.synopsis.rozie.ai/r4/get-content-versions',
  generateContentUrl:
    'https://wah065axpe.execute-api.ca-central-1.amazonaws.com/prod/session-debrief',
  executiveSummaryUrl:
    'https://wah065axpe.execute-api.ca-central-1.amazonaws.com/prod/executive-summary',
  getVersionContentUrl:
    'https://api.synopsis.rozie.ai/r4/get-version-content',
  publishContentPDFUrl:
    'https://api.synopsis.rozie.ai/r4/publish-pdf-content',
  saveEditedVersionContentUrl:
    'https://api.synopsis.rozie.ai/r4/manual-edit-generated-content',
  generateContentPDFUrl:
    'https://api.synopsis.rozie.ai/r4/generate-content-pdf',
  getPreSignedPDFUrl:
    'https://api.synopsis.rozie.ai/r4/get-content-pdf',
  uploadManualExecutiveSummaryUrl:
    'https://0s35g6c1ie.execute-api.ca-central-1.amazonaws.com/prod/upload-manual-executive-summary',
  analyticsApiEndpoint: 'https://api.synopsis.rozie.ai/r5/admin-analytics',
  USER_POOL_WEB_CLIENT_ID: '4uoviltr9pd5km5nltmvkf0ovh',
  USER_POOL_ID: 'ca-central-1_zFNGJuTjd',
  AUTH_API_END_POINT: 'https://cognito-idp.ca-central-1.amazonaws.com',
  REQUEST_ACCESS_API:
    'https://ifmrpnrth0.execute-api.ca-central-1.amazonaws.com/prod/request-access',
  REQUEST_ACCESS_API_KEY: '9MitsUZQJ566GezJRZXrz6Tqt64MVWyCh4gZ2M07',
  X_API_KEY: 'zpVl7dR3Cf3l56RsfpfDp4aEvfMFMHFL6ualSok5',
  wsUrl: 'wss://admin-ws.api.synopsis.rozie.ai/',
  audioRecorderUrl: 'https://api.synopsis.rozie.ai/r2/postAudioChunk',
};

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  getTranscriberPreSignedUrl:
    ' https://dev.api.synopsis.rozie.ai/r2/getPreSignedUrl',
  putTranscript: 'https://dev.api.synopsis.rozie.ai/r2/postTranscript',
  postData: 'https://dev.api.synopsis.rozie.ai/r2/config',
  getEventDetails: 'https://dev.api.synopsis.rozie.ai/r1/getEventDetails',
  getEventConfig: 'https://dev.api.synopsis.rozie.ai/r1/getEventConfig',
  postCurrentSessionId:
    'https://dev.api.synopsis.rozie.ai/r2/getCurrentSessionDetails',
  USER_POOL_WEB_CLIENT_ID: 'ckj0esj3hj5utldceksic8p9f',
  USER_POOL_ID: 'ca-central-1_OQOEfllk7',
  AUTH_API_END_POINT: 'https://cognito-idp.ca-central-1.amazonaws.com',
  REQUEST_ACCESS_API:
    'https://6r1ufmxw01.execute-api.ca-central-1.amazonaws.com/dev/request-access',
  REQUEST_ACCESS_API_KEY: 'wRc0COL6sp6jOC6j2ry2m639O1NUsklH4EFp4xbm',
  X_API_KEY: 'jYxynvOG8J8IGswZ4pZJV3EiGInjqY1UJZWrovyc',
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

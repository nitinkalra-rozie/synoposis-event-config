// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  cognitoUserPoolId:'ca-central-1_sBbyiaKRm',
  cognitoAppClientId:'tkn7hpp0pd80vd70h28sl1qt3',
  getTranscriberPreSignedUrl:' https://rnfzrkj1ib.execute-api.ca-central-1.amazonaws.com/dev/getPreSignedUrl',
  putTranscript:'https://rnfzrkj1ib.execute-api.ca-central-1.amazonaws.com/dev/postTranscript',
  postData:'https://rnfzrkj1ib.execute-api.ca-central-1.amazonaws.com/dev/adminapplambdaconfig',
  getEventDetails:'https://o7hgaq06eh.execute-api.ca-central-1.amazonaws.com/dev/getEventDetails',
  postCurrentSessionId:'https://trvgu0j4ra.execute-api.ca-central-1.amazonaws.com/dev/getCurrentSessionDetails'
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  cognitoUserPoolId:'ca-central-1_e3Jlkr7Zr',
  cognitoAppClientId:'vsvdkhtthnab0np3e5arsshdd',
  getTranscriberPreSignedUrl:'https://fqbvo8ifm0.execute-api.ca-central-1.amazonaws.com/dev/getPreSignedUrl',
  putTranscript:'https://4pm6ygxgfl.execute-api.ca-central-1.amazonaws.com/dev/postTranscript',
  postData:'https://4pm6ygxgfl.execute-api.ca-central-1.amazonaws.com/dev/adminapplambdaconfig',
  getEventDetails:'https://dcbdtg2n1a.execute-api.ca-central-1.amazonaws.com/dev/getEventDetails',
  postCurrentSessionId:'https://ukm31jyh2f.execute-api.ca-central-1.amazonaws.com/dev/getCurrentSessionDetails'

};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

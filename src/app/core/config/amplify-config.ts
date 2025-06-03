import { environment } from 'src/environments/environment';

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: environment.USER_POOL_ID,
      userPoolClientId: environment.USER_POOL_WEB_CLIENT_ID,
    },
  },
};

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './amplify-config';

export function amplifyInitializer() {
  return () => {
    Amplify.configure(amplifyConfig);
  };
}

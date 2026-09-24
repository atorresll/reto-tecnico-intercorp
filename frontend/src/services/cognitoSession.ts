import { fetchAuthSession } from 'aws-amplify/auth';
import type { SessionTokenProvider } from './endorsementService';

export const cognitoSession: SessionTokenProvider = {
  async getIdToken() {
    return (await fetchAuthSession()).tokens?.idToken?.toString();
  },
};

import { fetchAuthSession } from 'aws-amplify/auth';
import type { SessionTokenProvider } from './endorsementService';

export const cognitoSession: SessionTokenProvider = {
  async getIdToken() {
    try {
      return (await fetchAuthSession({ forceRefresh: true })).tokens?.idToken?.toString()
        ?? localStorage.getItem('idToken')
        ?? localStorage.getItem('token')
        ?? undefined;
    } catch (error) {
      const fallbackToken = localStorage.getItem('idToken') ?? localStorage.getItem('token');
      if (fallbackToken) return fallbackToken;
      throw new Error(
        error instanceof Error
          ? `La sesión de Cognito expiró: ${error.message}`
          : 'La sesión de Cognito expiró. Inicie sesión nuevamente.',
      );
    }
  },
};

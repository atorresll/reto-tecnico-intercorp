import type { Endorsement } from '../domain/endorsementSchema';

export interface SessionTokenProvider {
  getIdToken(): Promise<string | undefined>;
}

export interface EndorsementService {
  translate(endorsement: Endorsement): Promise<unknown>;
}

export function createEndorsementService(
  tokenProvider: SessionTokenProvider,
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '',
): EndorsementService {
  return {
    async translate(endorsement) {
      const token = await tokenProvider.getIdToken();
      if (!token) throw new Error('La sesión de Cognito no contiene un token válido');

      const response = await fetch(`${apiBaseUrl}/endorse/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(endorsement),
      });
      if (!response.ok) {
        throw new Error(`No se pudo traducir el endoso (${response.status})`);
      }
      return response.json();
    },
  };
}

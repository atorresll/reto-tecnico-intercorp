import type { Endorsement } from '../domain/endorsementSchema';

export interface SessionTokenProvider {
  getIdToken(): Promise<string | undefined>;
}

export interface EndorsementService {
  translate(endorsement: Endorsement): Promise<unknown>;
}

function sanitizeToken(value: string | null | undefined): string | undefined {
  const token = value?.trim().replace(/\s+/g, '');
  return token || undefined;
}

export function createEndorsementService(
  tokenProvider: SessionTokenProvider,
  apiBaseUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '',
): EndorsementService {
  return {
    async translate(endorsement) {
      let token: string | undefined;
      try {
        token = sanitizeToken(await tokenProvider.getIdToken());
      } catch (error) {
        console.warn(
          'Cognito no está disponible; se intentará la petición local sin token.',
          error instanceof Error ? error.message : error,
        );
      }
      token ??= sanitizeToken(localStorage.getItem('idToken') ?? localStorage.getItem('token'));

      const normalizedApiUrl = apiBaseUrl.trim().replace(/\/+$/, '');
      const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/.test(normalizedApiUrl);
      if (!token && !isLocalApi) {
        throw new Error('La sesión de Cognito no contiene un token válido');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${normalizedApiUrl}/endorse/translate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(endorsement),
      });
      if (!response.ok) {
        let message = `No se pudo traducir el endoso (${response.status})`;
        try {
          const errorBody = await response.json() as { message?: string; error?: string };
          message = errorBody.message ?? errorBody.error ?? message;
        } catch {
          // Preserve the HTTP status when the gateway does not return JSON.
        }
        throw new Error(message);
      }
      return response.json();
    },
  };
}

export interface ExternalApiIntegration {
  translate(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export class UnconfiguredExternalApiIntegration implements ExternalApiIntegration {
  async translate(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return payload;
  }
}

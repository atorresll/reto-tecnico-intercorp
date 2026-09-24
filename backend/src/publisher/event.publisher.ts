export interface EventPublisher {
  publish(event: Record<string, unknown>): Promise<void>;
}

export class NoopEventPublisher implements EventPublisher {
  async publish(_event: Record<string, unknown>): Promise<void> {}
}

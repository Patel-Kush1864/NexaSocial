export class StreamScheduledEvent {
  constructor(
    public readonly streamId: string,
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly scheduledAt: Date,
  ) {}
}

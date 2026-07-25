export class StreamEndedEvent {
  constructor(
    public readonly streamId: string,
    public readonly workspaceId: string,
    public readonly endedAt: Date,
  ) {}
}

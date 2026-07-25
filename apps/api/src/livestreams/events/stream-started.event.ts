export class StreamStartedEvent {
  constructor(
    public readonly streamId: string,
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly platformsCount: number,
  ) {}
}

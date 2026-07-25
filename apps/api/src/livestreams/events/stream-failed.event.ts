export class StreamFailedEvent {
  constructor(
    public readonly streamId: string,
    public readonly workspaceId: string,
    public readonly reason: string,
  ) {}
}

export class StreamCreatedEvent {
  constructor(
    public readonly streamId: string,
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly title: string,
  ) {}
}

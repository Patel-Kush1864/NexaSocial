export class PlatformFailedEvent {
  constructor(
    public readonly streamId: string,
    public readonly platformId: string,
    public readonly platformName: string,
    public readonly reason: string,
  ) {}
}

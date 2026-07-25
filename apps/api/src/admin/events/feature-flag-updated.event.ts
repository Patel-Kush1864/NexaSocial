export class FeatureFlagUpdatedEvent {
  constructor(
    public readonly name: string,
    public readonly isEnabled: boolean,
    public readonly adminUserId: string,
  ) {}
}

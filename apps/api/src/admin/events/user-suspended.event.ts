export class UserSuspendedEvent {
  constructor(
    public readonly userId: string,
    public readonly adminUserId: string,
    public readonly isSuspended: boolean,
  ) {}
}

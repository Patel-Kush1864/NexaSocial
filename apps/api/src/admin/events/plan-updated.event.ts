export class PlanUpdatedEvent {
  constructor(
    public readonly planId: string,
    public readonly planName: string,
    public readonly adminUserId: string,
  ) {}
}

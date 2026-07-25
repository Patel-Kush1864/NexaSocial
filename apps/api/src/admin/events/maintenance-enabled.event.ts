export class MaintenanceEnabledEvent {
  constructor(
    public readonly enabled: boolean,
    public readonly adminUserId: string,
  ) {}
}

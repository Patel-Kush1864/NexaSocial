export class WorkspaceDeletedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly adminUserId: string,
  ) {}
}

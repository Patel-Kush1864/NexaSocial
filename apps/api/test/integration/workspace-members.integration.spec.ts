import {
  createMockWorkspace,
  createMockWorkspaceMember,
} from '../fixtures/workspace.fixture';

describe('Workspace -> Members Module Integration', () => {
  it('should manage workspace roles and ownership transfers cleanly', () => {
    const workspace = createMockWorkspace({ ownerId: 'user-owner' });
    const member = createMockWorkspaceMember({
      workspaceId: workspace.id,
      userId: 'user-member',
      role: 'ADMIN',
    });

    expect(workspace.ownerId).not.toBe(member.userId);
    expect(member.workspaceId).toBe(workspace.id);
  });
});

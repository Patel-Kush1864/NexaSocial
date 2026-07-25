import * as crypto from 'crypto';

export const createMockWorkspace = (overrides: Record<string, any> = {}) => ({
  id: crypto.randomUUID(),
  name: 'Acme Workspace',
  slug: 'acme-workspace',
  ownerId: crypto.randomUUID(),
  description: 'Enterprise test workspace',
  avatar: 'https://example.com/workspace.png',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockWorkspaceMember = (
  overrides: Record<string, any> = {},
) => ({
  id: crypto.randomUUID(),
  workspaceId: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  role: 'MEMBER',
  joinedAt: new Date(),
  ...overrides,
});

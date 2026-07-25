import * as crypto from 'crypto';

export interface MockUser {
  id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  status: string;
  isActive: boolean;
  isEmailVerified: boolean;
  verificationToken?: string;
  passwordResetToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockUser = (
  overrides: Partial<MockUser> = {},
): MockUser => ({
  id: crypto.randomUUID(),
  email: `user_${Math.floor(Math.random() * 10000)}@example.com`,
  password: '$2b$10$e8p2H1N5a/7Z9Z.4jX7QxO0qgG.yFw4G4R9X0Y2Z4A6B8C0D2E4F6',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+15550199',
  avatar: 'https://example.com/avatar.jpg',
  status: 'ACTIVE',
  isActive: true,
  isEmailVerified: true,
  verificationToken: undefined,
  passwordResetToken: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockRegisterDto = {
  email: 'testuser@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
};

export const mockLoginDto = {
  email: mockRegisterDto.email,
  password: mockRegisterDto.password,
};

export const createMockMailService = () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWorkspaceInvitationEmail: jest.fn().mockResolvedValue(true),
  sendPaymentConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendSubscriptionRenewalEmail: jest.fn().mockResolvedValue(true),
  sendStreamReminderEmail: jest.fn().mockResolvedValue(true),
});

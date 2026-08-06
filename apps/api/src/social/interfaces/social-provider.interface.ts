import { SocialAccount } from '../entities/social-account.entity';

export interface SocialProvider {
  /**
   * Generates the OAuth authorization URL to redirect the user to.
   */
  connect(userId: string, state?: string): Promise<string> | string;

  /**
   * Handles the OAuth callback, exchanges authorization code for tokens,
   * retrieves user profile and pages/channels, and persists SocialAccount entity records.
   */
  handleCallback(
    code: string,
    userId: string,
    state?: string,
  ): Promise<SocialAccount[] | SocialAccount>;

  /**
   * Disconnects a connected account by ID for a specific user.
   */
  disconnect(id: string, userId: string): Promise<void>;

  /**
   * Fetches all connected accounts for the given user.
   */
  getAccounts(userId: string): Promise<SocialAccount[]>;

  /**
   * Refreshes access tokens when expired.
   */
  refreshToken(refreshToken: string): Promise<any>;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  role?: string;
  scope?: string;
  permissions?: string[];
}

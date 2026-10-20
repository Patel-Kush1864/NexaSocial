export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
}

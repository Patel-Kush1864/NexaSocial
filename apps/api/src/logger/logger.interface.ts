export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'verbose';

export type LogCategory =
  | 'application'
  | 'request'
  | 'security'
  | 'exception'
  | 'database'
  | 'payment'
  | 'oauth'
  | 'workspace'
  | 'livestream'
  | 'notification'
  | 'system';

export interface LogPayload {
  message: string;
  context?: string;
  category?: LogCategory;
  metadata?: Record<string, unknown>;
  trace?: string;
}

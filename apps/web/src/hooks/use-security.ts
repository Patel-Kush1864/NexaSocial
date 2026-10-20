import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  event: string;
  severity: SecuritySeverity;
  userEmail?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export interface SecuritySummary {
  adminLogins: number;
  failedLogins: number;
  activeSessions: number;
  suspiciousActivity: number;
  privilegedActions: number;
  securityEvents: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SecurityQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  severity?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

function buildQueryString(options?: SecurityQueryOptions) {
  if (!options) return '';
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
}

export function useSecuritySummary() {
  return useQuery({
    queryKey: ['security-summary'],
    queryFn: async (): Promise<SecuritySummary> => {
      const res = await apiClient.get('/security/summary');
      return res.data;
    },
  });
}

export function useAdminLogins(options?: SecurityQueryOptions) {
  return useQuery({
    queryKey: ['security-admin-logins', options],
    queryFn: async (): Promise<PaginatedResponse<SecurityEvent>> => {
      const qs = buildQueryString(options);
      const res = await apiClient.get(`/security/admin-logins${qs}`);
      return res.data;
    },
  });
}

export function useFailedLogins(options?: SecurityQueryOptions) {
  return useQuery({
    queryKey: ['security-failed-logins', options],
    queryFn: async (): Promise<PaginatedResponse<SecurityEvent>> => {
      const qs = buildQueryString(options);
      const res = await apiClient.get(`/security/failed-logins${qs}`);
      return res.data;
    },
  });
}

export function useSuspiciousActivity(options?: SecurityQueryOptions) {
  return useQuery({
    queryKey: ['security-suspicious-activity', options],
    queryFn: async (): Promise<PaginatedResponse<SecurityEvent>> => {
      const qs = buildQueryString(options);
      const res = await apiClient.get(`/security/suspicious-activity${qs}`);
      return res.data;
    },
  });
}

export function useSecurityEvents(options?: SecurityQueryOptions) {
  return useQuery({
    queryKey: ['security-events', options],
    queryFn: async (): Promise<PaginatedResponse<SecurityEvent>> => {
      const qs = buildQueryString(options);
      const res = await apiClient.get(`/security/events${qs}`);
      return res.data;
    },
  });
}

export function useActiveSessions(options?: SecurityQueryOptions) {
  return useQuery({
    queryKey: ['security-active-sessions', options],
    queryFn: async (): Promise<PaginatedResponse<ActiveSession>> => {
      const qs = buildQueryString(options);
      const res = await apiClient.get(`/security/active-sessions${qs}`);
      return res.data;
    },
  });
}

// Privileged Actions is essentially Audit Logs, but fetched from Security Controller to enforce platform.security.view scoping if needed
export function usePrivilegedActions(options?: SecurityQueryOptions) {
  return useQuery({
    queryKey: ['security-privileged-actions', options],
    queryFn: async (): Promise<PaginatedResponse<any>> => {
      const qs = buildQueryString(options);
      const res = await apiClient.get(`/security/privileged-actions${qs}`);
      return res.data;
    },
  });
}

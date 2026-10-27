import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface AuditLogAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditLog {
  id: string;
  adminUserId: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt?: string;
  created_at?: string;
  adminUser?: AuditLogAdminUser;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAuditLogs(params: AuditLogQueryParams) {
  const query = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
      );

      const response = await apiClient.get<AuditLogResponse>('/audit', {
        params: cleanParams,
        headers: {
          'x-nexa-scope': 'PLATFORM',
        },
      });
      const resData = response.data;
      if (Array.isArray(resData?.data)) {
        resData.data = resData.data.map((item) => ({
          ...item,
          createdAt: item.createdAt || item.created_at,
          created_at: item.created_at || item.createdAt,
        }));
      }
      return resData;
    },
  });

  return { ...query, data: query.data as AuditLogResponse | undefined };
}

export function useAuditLogDetails(id: string | null) {
  const query = useQuery({
    queryKey: ['audit-logs', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<AuditLog>(`/audit/${id}`, {
        headers: {
          'x-nexa-scope': 'PLATFORM',
        },
      });
      const item = response.data;
      if (item) {
        item.createdAt = item.createdAt || item.created_at;
        item.created_at = item.created_at || item.createdAt;
      }
      return item;
    },
    enabled: !!id,
  });

  return { ...query, data: query.data as AuditLog | null | undefined };
}

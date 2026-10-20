import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { PlatformActivity, PlatformActivityResponse } from '@/types';

export interface UsePlatformActivityParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  eventType?: string;
  actorId?: string;
  workspaceId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function usePlatformActivity(params: UsePlatformActivityParams = {}) {
  return useQuery({
    queryKey: ['platform', 'activity', params],
    queryFn: async () => {
      // Clean up undefined or empty params
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const { data } = await apiClient.get<PlatformActivityResponse>(
        `/platform/activity?${queryParams.toString()}`
      );
      
      return data;
    },
  });
}

export function usePlatformActivityDetails(id: string | null) {
  return useQuery({
    queryKey: ['platform', 'activity', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get<{ data: PlatformActivity }>(
        `/platform/activity/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

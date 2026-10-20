import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

export function usePlatformActivity(
  params: { category?: string; page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }
) {
  const query = useQuery({
    queryKey: ['admin', 'platform-activity', params],
    queryFn: () => adminService.getPlatformActivity(params),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination || { page: params.page || 1, limit: params.limit || 10, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

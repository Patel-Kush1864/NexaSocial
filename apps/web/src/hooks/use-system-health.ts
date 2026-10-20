import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';

export const SYSTEM_HEALTH_KEY = ['admin', 'system-health'];
export const FAILED_JOBS_KEY = (queue: string, page: number, limit: number) => ['admin', 'system-health', 'failed-jobs', queue, page, limit];

export function useSystemHealth() {
  return useQuery({
    queryKey: SYSTEM_HEALTH_KEY,
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 30000, // 30 seconds
  });
}

export function useRefreshSystemHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminService.refreshSystemHealth(),
    onSuccess: (data) => {
      queryClient.setQueryData(SYSTEM_HEALTH_KEY, data);
      toast.success('System health updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to refresh system health');
    },
  });
}

export function useFailedJobs(queue: string, page: number, limit: number) {
  return useQuery({
    queryKey: FAILED_JOBS_KEY(queue, page, limit),
    queryFn: () => adminService.getFailedJobs(queue, page, limit),
  });
}

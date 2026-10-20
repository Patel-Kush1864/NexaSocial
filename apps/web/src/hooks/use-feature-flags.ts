import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: () => adminService.getFeatureFlags(),
  });
}

export function useFeatureFlagStatistics() {
  return useQuery({
    queryKey: ['admin', 'feature-flags', 'statistics'],
    queryFn: () => adminService.getFeatureFlagStatistics(),
  });
}

export function useToggleFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => 
      adminService.toggleFeatureFlag(key, enabled),
    onSuccess: (data, variables) => {
      toast.success(`Feature flag ${variables.key} successfully ${variables.enabled ? 'enabled' : 'disabled'}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags', 'statistics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle feature flag');
    }
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';

export function useAdministrators(params?: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}) {
  return useQuery({
    queryKey: ['admin', 'administrators', params],
    queryFn: () => adminService.getAdministrators(params),
  });
}

export function useAdministratorDetails(id: string) {
  return useQuery({
    queryKey: ['admin', 'administrators', id],
    queryFn: () => adminService.getAdministratorById(id),
    enabled: !!id,
  });
}

export function useCreateAdministrator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { email: string; firstName?: string; lastName?: string; roleName: string; status?: string }) => 
      adminService.createAdministrator(payload),
    onSuccess: () => {
      toast.success('Administrator created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'administrators'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create administrator');
    }
  });
}

export function useUpdateAdministratorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminService.updateAdministratorRole(id, role),
    onSuccess: (_, variables) => {
      toast.success('Administrator role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'administrators'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'administrators', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  });
}

export function useUpdateAdministratorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateAdministratorStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success('Administrator status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'administrators'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'administrators', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });
}

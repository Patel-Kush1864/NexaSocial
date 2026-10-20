import { PageHeader } from '@/components/shared/page-header';

interface UsersHeaderProps {
  total: number;
}

export function UsersHeader({ total }: UsersHeaderProps) {
  return (
    <PageHeader
      title="User Management"
      description="Manage and monitor NexaSocial platform users."
      badge={`${total || 0} Total Users`}
    />
  );
}

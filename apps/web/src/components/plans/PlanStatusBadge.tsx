import { Badge } from '@/components/ui/badge';
import { PlanStatus } from '@/types';
import { CheckCircle2, XCircle, Archive } from 'lucide-react';

interface PlanStatusBadgeProps {
  status: PlanStatus;
}

export function PlanStatusBadge({ status }: PlanStatusBadgeProps) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    case 'ARCHIVED':
      return (
        <Badge variant="outline" className="text-gray-400 border-gray-600">
          <Archive className="w-3 h-3 mr-1" />
          Archived
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

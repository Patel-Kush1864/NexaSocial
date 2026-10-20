import { Badge } from '@/components/ui/badge';

export function UserStatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
        Active
      </Badge>
    );
  }
  if (status === 'SUSPENDED') {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Suspended
      </Badge>
    );
  }
  if (status === 'DEACTIVATED') {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        Deactivated
      </Badge>
    );
  }
  return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
}

'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConnectedAccountErrors } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, XCircle, Info, Hash, Mail, Briefcase, Calendar, ShieldAlert } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  platform: {
    id: string;
    name: string;
    key: string;
  };
  account: {
    name: string;
    username?: string;
    avatar?: string;
  };
  workspace: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  status: string;
  connectedAt: string;
  lastSync: string | null;
  errors: {
    count: number;
    lastOccurredAt: string | null;
  };
}

interface DrawerProps {
  account: ConnectedAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectedAccountDetailsDrawer({ account, open, onOpenChange }: DrawerProps) {
  const { data: errorsData, isLoading: isLoadingErrors } = useConnectedAccountErrors(
    account?.id || '',
    { limit: 5 }
  );

  if (!account) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
      case 'ACTIVE':
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'TOKEN_EXPIRED':
      case 'EXPIRED':
        return <Badge variant="destructive" className="bg-orange-500"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'ERROR':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Disconnected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={account.account.avatar} />
              <AvatarFallback>{account.account.name.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{account.account.name}</span>
          </h2>
        </div>

        <div className="space-y-8 mt-6">
          {/* ACCOUNT SECTION */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              ACCOUNT
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">{account.platform.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Username / Handle</span>
                <span className="font-medium">{account.account.username || 'Not available'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(account.status)}
              </div>
            </div>
          </section>

          {/* WORKSPACE & OWNER SECTION */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              WORKSPACE & OWNER
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Workspace</span>
                <span className="font-medium">{account.workspace?.name || 'No Workspace'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Workspace ID</span>
                <span className="font-mono text-xs text-muted-foreground">{account.workspace?.id || 'N/A'}</span>
              </div>
              <div className="border-t border-border/50 my-2 pt-2" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Owner Name</span>
                <span className="font-medium">{account.owner?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Email</span>
                <span className="font-medium">{account.owner?.email || 'N/A'}</span>
              </div>
            </div>
          </section>

          {/* CONNECTION SECTION */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              CONNECTION DETAILS
            </h3>
            <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Connected At</span>
                <span className="font-medium">
                  {format(new Date(account.connectedAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Sync</span>
                <span className="font-medium">
                  {account.lastSync 
                    ? formatDistanceToNow(new Date(account.lastSync), { addSuffix: true }) 
                    : 'Not available'}
                </span>
              </div>
            </div>
          </section>

          {/* RECENT ERRORS */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              RECENT API ERRORS
            </h3>
            
            {isLoadingErrors ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : errorsData?.data?.length > 0 ? (
              <div className="space-y-3">
                {errorsData.data.map((err: any) => (
                  <div key={err.id} className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-destructive">Code: {err.statusCode}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(err.occurredAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs font-mono break-all bg-background/50 p-2 rounded">
                      {err.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/20 border border-dashed rounded-lg text-sm text-muted-foreground">
                No recent API errors found for this account.
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureFlagDetailsDrawer } from './feature-flag-details-drawer';
import { FeatureFlagToggleDialog } from './feature-flag-toggle-dialog';
import { Eye } from 'lucide-react';

interface FeatureFlagTableProps {
  flags: any[];
  isLoading: boolean;
}

export function FeatureFlagTable({ flags, isLoading }: FeatureFlagTableProps) {
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [toggleFlag, setToggleFlag] = useState<any>(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

  const handleToggleClick = (flag: any) => {
    setToggleFlag(flag);
    setToggleDialogOpen(true);
  };

  const handleViewDetails = (flag: any) => {
    setSelectedFlag(flag);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md">
        <h3 className="text-lg font-medium">No feature flags found</h3>
        <p className="text-muted-foreground">Adjust your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell className="font-medium">
                  {flag.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{flag.name}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={flag.isEnabled ? 'default' : 'secondary'} className={flag.isEnabled ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {flag.isEnabled ? 'ON' : 'OFF'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {flag.updatedAt && !isNaN(new Date(flag.updatedAt).getTime())
                    ? format(new Date(flag.updatedAt), 'MMM dd, yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleViewDetails(flag)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={flag.isEnabled}
                      onClick={() => handleToggleClick(flag)}
                      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
                        flag.isEnabled ? 'bg-primary' : 'bg-input'
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          flag.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FeatureFlagDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        flag={selectedFlag}
      />

      <FeatureFlagToggleDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
        flag={toggleFlag}
      />
    </>
  );
}

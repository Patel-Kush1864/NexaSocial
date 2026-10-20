'use client';

import { useState } from 'react';
import { useFailedJobs } from '@/hooks/use-system-health';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';

export function FailedJobsTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useFailedJobs('default', page, 10);

  if (error) {
    return (
      <ErrorState
        title="Error"
        message="Unable to load failed jobs."
        compact
        className="border-0 bg-transparent shadow-none"
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.data.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground text-sm">
        No failed jobs. System queues are currently clear.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Failed At</TableHead>
              <TableHead>Error Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((job: any) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium text-xs">{job.id}</TableCell>
                <TableCell>{job.name}</TableCell>
                <TableCell>{job.attempts}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {job.failedAt ? format(new Date(job.failedAt), 'PPpp') : 'N/A'}
                </TableCell>
                <TableCell className="max-w-[300px] truncate" title={job.error}>
                  {job.error}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {data.meta.page} of {data.meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
          disabled={page >= data.meta.totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

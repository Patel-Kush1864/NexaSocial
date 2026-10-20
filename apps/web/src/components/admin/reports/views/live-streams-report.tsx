/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useReport } from '@/hooks/use-reports';
import { DateRange } from '@/components/admin/reports/report-date-range';
import { ReportKpiCards } from '../report-kpi-cards';
import { ReportChart } from '../report-chart';
import { ReportExportButton } from '../report-export-button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function LiveStreamsReport({ dateRange }: { dateRange: DateRange | undefined }) {
  const queryParams = {
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, isError } = useReport('LIVE_STREAMS', queryParams);

  if (isLoading) return <div className="text-gray-400 py-10 text-center">Loading report...</div>;
  if (isError || !data) return <div className="text-red-400 py-10 text-center">Unable to load this report.</div>;

  const kpis = [
    { title: 'Total Streams', value: data.summary.total || 0 },
    { title: 'Live Now', value: data.summary.liveCount || 0 },
    { title: 'Scheduled', value: data.summary.scheduledCount || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReportExportButton reportType="LIVE_STREAMS" params={queryParams} />
      </div>
      <ReportKpiCards cards={kpis} />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Streams Created Over Time</h3>
        <ReportChart data={data.chart} type="line" />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Stream History</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-400">Title</TableHead>
              <TableHead className="text-gray-400">Workspace</TableHead>
              <TableHead className="text-gray-400">Platforms</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 text-right">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((stream: any) => (
              <TableRow key={stream.id} className="border-white/10 text-white hover:bg-white/5">
                <TableCell className="font-medium">{stream.title}</TableCell>
                <TableCell className="text-gray-400">{stream.workspaceName}</TableCell>
                <TableCell>{stream.platformCount}</TableCell>
                <TableCell>
                  <Badge variant={stream.status === 'LIVE' ? 'default' : 'secondary'}>
                    {stream.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-gray-400">
                  {format(new Date(stream.createdAt), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

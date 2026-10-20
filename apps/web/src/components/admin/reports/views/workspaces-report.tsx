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

export function WorkspacesReport({ dateRange }: { dateRange: DateRange | undefined }) {
  const queryParams = {
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, isError } = useReport('WORKSPACES', queryParams);

  if (isLoading) return <div className="text-gray-400 py-10 text-center">Loading report...</div>;
  if (isError || !data) return <div className="text-red-400 py-10 text-center">Unable to load this report.</div>;

  const kpis = [
    { title: 'Total Workspaces', value: data.summary.total || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReportExportButton reportType="WORKSPACES" params={queryParams} />
      </div>
      <ReportKpiCards cards={kpis} />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Workspace Growth</h3>
        <ReportChart data={data.chart} type="line" />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Workspaces List</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Owner</TableHead>
              <TableHead className="text-gray-400 text-right">Members</TableHead>
              <TableHead className="text-gray-400 text-right">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((ws: any) => (
              <TableRow key={ws.id} className="border-white/10 text-white hover:bg-white/5">
                <TableCell>{ws.name}</TableCell>
                <TableCell className="text-gray-400">{ws.ownerEmail}</TableCell>
                <TableCell className="text-right">{ws.memberCount}</TableCell>
                <TableCell className="text-right text-gray-400">
                  {format(new Date(ws.createdAt), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

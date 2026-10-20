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

export function SocialPlatformsReport({ dateRange }: { dateRange: DateRange | undefined }) {
  const queryParams = {
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, isError } = useReport('SOCIAL_PLATFORMS', queryParams);

  if (isLoading) return <div className="text-gray-400 py-10 text-center">Loading report...</div>;
  if (isError || !data) return <div className="text-red-400 py-10 text-center">Unable to load this report.</div>;

  const kpis = [
    { title: 'Total Connected Accounts', value: data.summary.total || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReportExportButton reportType="SOCIAL_PLATFORMS" params={queryParams} />
      </div>
      <ReportKpiCards cards={kpis} />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Platform Distribution</h3>
        <ReportChart data={data.chart} type="bar" />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Connected Accounts</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-400">Platform</TableHead>
              <TableHead className="text-gray-400">Username</TableHead>
              <TableHead className="text-gray-400">Workspace</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 text-right">Connected At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((account: any) => (
              <TableRow key={account.id} className="border-white/10 text-white hover:bg-white/5">
                <TableCell className="capitalize">{account.platform.toLowerCase()}</TableCell>
                <TableCell className="text-gray-400">{account.username}</TableCell>
                <TableCell className="text-gray-400">{account.workspaceName}</TableCell>
                <TableCell>
                  <Badge variant={account.status === 'CONNECTED' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-gray-400">
                  {format(new Date(account.createdAt), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

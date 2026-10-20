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

export function UsersReport({ dateRange }: { dateRange: DateRange | undefined }) {
  const queryParams = {
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, isError } = useReport('USERS', queryParams);

  if (isLoading) {
    return <div className="text-gray-400 py-10 text-center">Loading report...</div>;
  }

  if (isError || !data) {
    return <div className="text-red-400 py-10 text-center">Unable to load this report. Please try again.</div>;
  }

  const kpis = [
    { title: 'Total Users', value: data.summary.total || 0 },
    { title: 'Active Users', value: data.summary.activeCount || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReportExportButton reportType="USERS" params={queryParams} />
      </div>

      <ReportKpiCards cards={kpis} />

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">User Growth</h3>
        <ReportChart data={data.chart} type="line" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Recent Users</h3>
        {data.rows.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No data available for the selected filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((user: any) => (
                <TableRow key={user.id} className="border-white/10 text-white hover:bg-white/5">
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-gray-400">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-gray-400">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

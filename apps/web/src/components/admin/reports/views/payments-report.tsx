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

export function PaymentsReport({ dateRange }: { dateRange: DateRange | undefined }) {
  const queryParams = {
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, isError } = useReport('PAYMENTS', queryParams);

  if (isLoading) return <div className="text-gray-400 py-10 text-center">Loading report...</div>;
  if (isError || !data) return <div className="text-red-400 py-10 text-center">Unable to load this report.</div>;

  const kpis = [
    { title: 'Total Transactions', value: data.summary.total || 0 },
    { title: 'Successful', value: data.summary.success || 0 },
    { title: 'Failed', value: data.summary.failed || 0 },
    { title: 'Refunded', value: data.summary.refunded || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReportExportButton reportType="PAYMENTS" params={queryParams} />
      </div>
      <ReportKpiCards cards={kpis} />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Transactions Over Time</h3>
        <ReportChart data={data.chart} type="line" />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Recent Transactions</h3>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-400">Transaction ID</TableHead>
              <TableHead className="text-gray-400">User</TableHead>
              <TableHead className="text-gray-400">Amount</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((payment: any) => (
              <TableRow key={payment.id} className="border-white/10 text-white hover:bg-white/5">
                <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                <TableCell>{payment.userEmail}</TableCell>
                <TableCell>
                  {payment.currency} {Number(payment.amount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    payment.status === 'SUCCESS' ? 'default' : 
                    payment.status === 'FAILED' ? 'destructive' : 'secondary'
                  }>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-gray-400">
                  {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

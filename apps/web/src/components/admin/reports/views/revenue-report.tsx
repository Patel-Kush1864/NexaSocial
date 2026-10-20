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

export function RevenueReport({ dateRange }: { dateRange: DateRange | undefined }) {
  const queryParams = {
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, isError } = useReport('REVENUE', queryParams);

  if (isLoading) {
    return <div className="text-gray-400 py-10 text-center">Loading report...</div>;
  }

  if (isError || !data) {
    return <div className="text-red-400 py-10 text-center">Unable to load this report. Please try again.</div>;
  }

  // Create KPI cards dynamically based on currency
  const kpis: any[] = [];
  if (data.summary.revenueByCurrency && data.summary.revenueByCurrency.length > 0) {
    data.summary.revenueByCurrency.forEach((rev: any) => {
      kpis.push({
        title: `Gross Revenue (${rev.currency})`,
        value: `${rev.currency} ${rev.grossRevenue.toFixed(2)}`,
      });
      kpis.push({
        title: `Net Revenue (${rev.currency})`,
        value: `${rev.currency} ${rev.netRevenue.toFixed(2)}`,
      });
    });
  } else {
    kpis.push({ title: 'Gross Revenue', value: '0.00' });
    kpis.push({ title: 'Net Revenue', value: '0.00' });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReportExportButton reportType="REVENUE" params={queryParams} />
      </div>

      <ReportKpiCards cards={kpis} />

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Net Revenue Over Time</h3>
        <ReportChart data={data.chart} type="bar" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
        <h3 className="mb-4 text-sm font-medium text-gray-400">Successful Payments (Revenue Sources)</h3>
        {data.rows.length === 0 ? (
          <div className="text-center py-6 text-gray-500">No data available for the selected filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Plan</TableHead>
                <TableHead className="text-gray-400 text-right">Gross</TableHead>
                <TableHead className="text-gray-400 text-right">Refunds</TableHead>
                <TableHead className="text-gray-400 text-right">Net</TableHead>
                <TableHead className="text-gray-400 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((payment: any) => (
                <TableRow key={payment.id} className="border-white/10 text-white hover:bg-white/5">
                  <TableCell className="text-gray-300">{payment.userEmail}</TableCell>
                  <TableCell className="text-gray-300">{payment.planName || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {payment.currency} {Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-red-400">
                    {Number(payment.refundedAmount || 0) > 0 ? `-${payment.currency} ${Number(payment.refundedAmount).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {payment.currency} {Number(payment.netAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-gray-400">
                    {format(new Date(payment.createdAt), 'MMM d, yyyy')}
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

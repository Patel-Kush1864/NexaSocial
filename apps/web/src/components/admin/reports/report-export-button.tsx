'use client';

import { useState } from 'react';
import { DownloadIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerReportExport, ReportType, ReportQueryParams } from '@/hooks/use-reports';
import { toast } from 'sonner';

interface ReportExportButtonProps {
  reportType: ReportType;
  params: ReportQueryParams;
}

export function ReportExportButton({ reportType, params }: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await triggerReportExport(reportType, params);
      toast.success('Report exported successfully');
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}

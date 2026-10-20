/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Scope } from '@/types';

export type ReportType = 'USERS' | 'WORKSPACES' | 'SUBSCRIPTIONS' | 'REVENUE' | 'PAYMENTS' | 'LIVE_STREAMS' | 'SOCIAL_PLATFORMS';

export interface ReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  workspaceId?: string;
  status?: string;
  currency?: string;
  platform?: string;
  planId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ReportSummary {
  total?: number;
  activeCount?: number;
  success?: number;
  failed?: number;
  refunded?: number;
  liveCount?: number;
  scheduledCount?: number;
  revenueByCurrency?: Array<{
    currency: string;
    grossRevenue: number;
    refunds: number;
    netRevenue: number;
  }>;
}

export interface ReportChartData {
  labels: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

export interface ReportResponse<T = any> {
  reportType: ReportType;
  generatedAt: string;
  summary: ReportSummary;
  chart: ReportChartData;
  rows: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useReport<T = any>(reportType: ReportType, params: ReportQueryParams) {
  const endpointMap: Record<ReportType, string> = {
    'USERS': '/reports/users',
    'WORKSPACES': '/reports/workspaces',
    'SUBSCRIPTIONS': '/reports/subscriptions',
    'REVENUE': '/reports/revenue',
    'PAYMENTS': '/reports/payments',
    'LIVE_STREAMS': '/reports/live-streams',
    'SOCIAL_PLATFORMS': '/reports/social-platforms',
  };

  const query = useQuery({
    queryKey: ['reports', reportType, params],
    queryFn: async () => {
      // Filter out undefined parameters
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
      );

      const response = await apiClient.get<ReportResponse<any>>(endpointMap[reportType], {
        params: cleanParams,
        headers: {
          'x-nexa-scope': 'PLATFORM',
        },
      });
      return response.data;
    },
  });

  return {
    ...query,
    data: query.data as ReportResponse<any> | undefined,
  };
}

export async function triggerReportExport(reportType: ReportType, params: ReportQueryParams) {
  const endpointMap: Record<ReportType, string> = {
    'USERS': '/reports/export/users',
    'WORKSPACES': '/reports/export/workspaces',
    'SUBSCRIPTIONS': '/reports/export/subscriptions',
    'REVENUE': '/reports/export/revenue',
    'PAYMENTS': '/reports/export/payments',
    'LIVE_STREAMS': '/reports/export/live-streams',
    'SOCIAL_PLATFORMS': '/reports/export/social-platforms',
  };

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  );

  const queryString = new URLSearchParams(cleanParams as any).toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpointMap[reportType]}?${queryString}`;

  // We have to use fetch manually here if apiClient doesn't support blob streams directly 
  // or we can use apiClient but configure it for blobs.
  // Using native fetch for download pattern:
  const token = localStorage.getItem('auth_token'); // Or get from auth store

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-nexa-scope': 'PLATFORM',
    },
  });

  if (!response.ok) {
    if (response.status === 403) throw new Error('Forbidden: You do not have permission to export this report.');
    throw new Error('Failed to generate export');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;

  // Extract filename from header if possible
  const disposition = response.headers.get('Content-Disposition');
  let filename = `report_${reportType.toLowerCase()}_export.csv`;
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const matches = /filename="([^"]*)"/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1];
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  a.remove();
}

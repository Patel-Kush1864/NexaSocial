'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '@/types';
import { TrendingUp } from 'lucide-react';

interface OverviewChartProps {
  data?: ChartDataPoint[];
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Start') return dateStr;
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function OverviewChart({ data }: OverviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/40 rounded-xl bg-card/20">
        <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6 text-violet-400/70" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          No Audience Growth Analytics Yet
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Historical follower growth trends will plot automatically as daily
          snapshots are collected for your connected social accounts.
        </p>
      </div>
    );
  }

  // If single data point, replicate with a baseline start point for smooth visual render
  const chartData =
    data.length === 1
      ? [{ date: 'Start', value: data[0].value }, data[0]]
      : data;

  return (
    <div className="h-72 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => formatDate(val)}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => Number(val).toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            formatter={(value: any) => [
              Number(value || 0).toLocaleString(),
              'Followers',
            ]}
            labelFormatter={(label: any) => formatDate(label)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

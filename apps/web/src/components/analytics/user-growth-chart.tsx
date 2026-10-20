'use client';

import type { UserGrowthPoint } from '@/types/analytics';
import { TimeSeriesChart } from './time-series-chart';

interface UserGrowthChartProps {
  data: UserGrowthPoint[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <TimeSeriesChart 
      data={data} 
      xKey="date" 
      yKey="users" 
      tooltipLabel="Total Users" 
    />
  );
}

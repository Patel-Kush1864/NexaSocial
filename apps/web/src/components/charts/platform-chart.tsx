'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PlatformStat } from '@/types';

interface PlatformChartProps {
  data?: PlatformStat[];
}

const defaultData: PlatformStat[] = [
  { platform: 'YOUTUBE', followers: 12500, engagement: 85, percentage: 35 },
  { platform: 'INSTAGRAM', followers: 9800, engagement: 92, percentage: 28 },
  { platform: 'X', followers: 6400, engagement: 74, percentage: 18 },
  { platform: 'LINKEDIN', followers: 4200, engagement: 68, percentage: 12 },
  { platform: 'TWITCH', followers: 2500, engagement: 95, percentage: 7 },
];

const COLORS = ['#FF0000', '#E4405F', '#000000', '#0A66C2', '#9146FF'];

export function PlatformChart({ data = defaultData }: PlatformChartProps) {
  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="followers"
            nameKey="platform"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.platform}`}
                fill={COLORS[index % COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(23, 23, 23, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs font-semibold text-muted-foreground mr-3">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

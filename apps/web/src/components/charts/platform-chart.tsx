'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PlatformStat } from '@/types';
import { PieChart as PieChartIcon } from 'lucide-react';

interface PlatformChartProps {
  data?: PlatformStat[];
}

const PLATFORM_COLORS: Record<string, string> = {
  YOUTUBE: '#FF0000',
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E4405F',
  X: '#1DA1F2',
  TWITTER: '#1DA1F2',
  TIKTOK: '#00F2FE',
  TWITCH: '#9146FF',
  LINKEDIN: '#0A66C2',
};

const DEFAULT_COLOR = '#8B5CF6';

export function PlatformChart({ data }: PlatformChartProps) {
  const validData = (data || []).filter((item) => item && item.followers > 0);

  if (!validData || validData.length === 0) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/40 rounded-xl bg-card/20">
        <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-3">
          <PieChartIcon className="w-6 h-6 text-pink-400/70" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">
          No Platform Audience Data
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Connect your social accounts (YouTube, Facebook, Instagram, X) to view
          your follower breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={validData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="followers"
            nameKey="platform"
          >
            {validData.map((entry) => {
              const upper = String(entry.platform).toUpperCase();
              const fill = PLATFORM_COLORS[upper] || DEFAULT_COLOR;
              return (
                <Cell
                  key={`cell-${entry.platform}`}
                  fill={fill}
                  stroke="none"
                />
              );
            })}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(23, 23, 23, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            formatter={(value: any, name: any, item: any) => [
              `${Number(value || 0).toLocaleString()} followers (${item?.payload?.percentage || 0}%)`,
              name,
            ]}
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
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

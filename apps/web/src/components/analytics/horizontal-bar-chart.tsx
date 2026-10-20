/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useTheme } from 'next-themes';

interface HorizontalBarChartProps {
  data: any[];
  xKey?: string;
  yKey?: string;
  tooltipLabel?: string;
}

export function HorizontalBarChart({
  data,
  xKey = 'value',
  yKey = 'name',
  tooltipLabel = 'Value'
}: HorizontalBarChartProps) {
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const barColor = isDark ? '#3b82f6' : '#2563eb'; // blue-500 : blue-600
  const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 : gray-200
  const textColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'; // gray-800 : white

  return (
    <div className="h-[350px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis
            type="number"
            stroke={textColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey={yKey}
            type="category"
            stroke={textColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: gridColor,
              borderRadius: '8px',
              color: isDark ? '#f3f4f6' : '#111827'
            }}
            cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
            formatter={(value: any) => [Number(value || 0).toLocaleString(), tooltipLabel]}
            labelStyle={{ color: textColor, marginBottom: '4px' }}
          />
          <Bar dataKey={xKey} fill={barColor} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

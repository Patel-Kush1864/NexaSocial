'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';

interface TimeSeriesChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey?: string;
  yKey?: string;
  tooltipLabel?: string;
  yAxisTickFormatter?: (value: number) => string;
  tooltipValueFormatter?: (value: number) => string;
}

export function TimeSeriesChart({ 
  data, 
  xKey = 'date', 
  yKey = 'value', 
  tooltipLabel = 'Value',
  yAxisTickFormatter,
  tooltipValueFormatter
}: TimeSeriesChartProps) {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  const strokeColor = isDark ? '#3b82f6' : '#2563eb'; // blue-500 : blue-600
  const gridColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 : gray-200
  const textColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'; // gray-800 : white

  // Simple compact formatter (e.g., 12500 -> 12.5k)
  const defaultFormatYAxis = (tickItem: number) => {
    if (tickItem >= 1000) {
      return (tickItem / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return tickItem.toString();
  };
  
  const finalYAxisFormatter = yAxisTickFormatter || defaultFormatYAxis;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalTooltipFormatter: any = tooltipValueFormatter 
    ? (value: number) => [tooltipValueFormatter(value), tooltipLabel]
    : (value: number) => [value.toLocaleString(), tooltipLabel];

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey={xKey} 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickFormatter={finalYAxisFormatter}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg,
              borderColor: gridColor,
              borderRadius: '8px',
              color: isDark ? '#f3f4f6' : '#111827'
            }}
            itemStyle={{ color: strokeColor }}
            formatter={finalTooltipFormatter}
            labelStyle={{ color: textColor, marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            name={tooltipLabel}
            stroke={strokeColor}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: tooltipBg, stroke: strokeColor }}
            activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

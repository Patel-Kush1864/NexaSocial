'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

interface ReportChartProps {
  data: {
    labels: string[];
    series: { name: string; data: number[] }[];
  };
  type?: 'line' | 'bar';
}

export function ReportChart({ data, type = 'line' }: ReportChartProps) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5">
        <p className="text-sm text-gray-400">No data available for the selected date range.</p>
      </div>
    );
  }

  // Transform data to Recharts format: [{ name: 'Label', seriesName1: 10, seriesName2: 20 }]
  const chartData = data.labels.map((label, index) => {
    const point: any = { name: label };
    data.series.forEach((s) => {
      point[s.name] = s.data[index];
    });
    return point;
  });

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="h-96 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(23, 23, 23, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            <Legend />
            {data.series.map((s, idx) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={colors[idx % colors.length]}
                strokeWidth={3}
                dot={false}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(23, 23, 23, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            <Legend />
            {data.series.map((s, idx) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={colors[idx % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

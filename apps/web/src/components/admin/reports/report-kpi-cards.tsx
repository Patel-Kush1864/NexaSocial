'use client';

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number; // percentage
    isPositive: boolean;
  };
  subtitle?: string;
  loading?: boolean;
}

export function ReportKpiCards({ cards }: { cards: KpiCardProps[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight text-gray-400">{card.title}</h3>
          </div>
          {card.loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              {(card.trend || card.subtitle) && (
                <p className="mt-1 flex items-center text-xs text-gray-400">
                  {card.trend && (
                    <span
                      className={`mr-2 flex items-center ${
                        card.trend.value === 0
                          ? 'text-gray-400'
                          : card.trend.isPositive
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {card.trend.value === 0 ? (
                        <MinusIcon className="mr-1 h-3 w-3" />
                      ) : card.trend.isPositive ? (
                        <ArrowUpIcon className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(card.trend.value)}%
                    </span>
                  )}
                  {card.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

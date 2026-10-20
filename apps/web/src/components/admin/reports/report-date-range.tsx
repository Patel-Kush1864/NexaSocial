'use client';

import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface ReportDateRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function ReportDateRange({ date, setDate }: ReportDateRangeProps) {
  const [preset, setPreset] = useState<string>('last-30');
  const [customFrom, setCustomFrom] = useState<string>(date?.from ? format(date.from, 'yyyy-MM-dd') : '');
  const [customTo, setCustomTo] = useState<string>(date?.to ? format(date.to, 'yyyy-MM-dd') : '');

  useEffect(() => {
    if (preset === 'custom') return;
    
    const today = new Date();
    switch (preset) {
      case 'today':
        setDate({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDate({ from: yesterday, to: yesterday });
        break;
      case 'last-7':
        setDate({ from: subDays(today, 7), to: today });
        break;
      case 'last-30':
        setDate({ from: subDays(today, 30), to: today });
        break;
      case 'last-90':
        setDate({ from: subDays(today, 90), to: today });
        break;
      case 'this-month':
        setDate({ from: startOfMonth(today), to: today });
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
    }
  }, [preset, setDate]);

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      setDate({ from: new Date(customFrom), to: new Date(customTo) });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={(val) => { if (val) setPreset(val); }}>
        <SelectTrigger className="w-[160px] border-white/10 bg-white/5">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last-7">Last 7 Days</SelectItem>
          <SelectItem value="last-30">Last 30 Days</SelectItem>
          <SelectItem value="last-90">Last 90 Days</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal border-white/10 bg-white/5 hover:bg-white/10',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Custom Range</h4>
              <p className="text-sm text-muted-foreground">
                Set custom start and end dates.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="from" className="text-sm">From</label>
                <input
                  id="from"
                  type="date"
                  className="col-span-2 h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="to" className="text-sm">To</label>
                <input
                  id="to"
                  type="date"
                  className="col-span-2 h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
              <Button onClick={() => { setPreset('custom'); handleApplyCustom(); }} size="sm" className="mt-2">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

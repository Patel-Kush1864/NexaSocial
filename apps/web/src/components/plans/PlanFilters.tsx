import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlanFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  billingCycle: string;
  setBillingCycle: (value: string) => void;
}

export function PlanFilters({
  search,
  setSearch,
  status,
  setStatus,
  billingCycle,
  setBillingCycle,
}: PlanFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input
          placeholder="Search plans by name or slug code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
        />
      </div>

      <div className="flex gap-4 w-full md:w-auto">
        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800 text-white">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as string)}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="All Billing Cycles" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800 text-white">
            <SelectItem value="all">All Cycles</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

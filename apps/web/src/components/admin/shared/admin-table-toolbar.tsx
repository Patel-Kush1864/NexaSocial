import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  type: 'search' | 'select' | 'date';
  placeholder?: string;
  options?: FilterOption[];
}

interface AdminTableToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  filters: FilterConfig[];
  filterValues: Record<string, string>;
  onFilterChange: (id: string, value: string) => void;
  onClearFilters: () => void;
  searchPlaceholder?: string;
}

export function AdminTableToolbar({
  search,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  searchPlaceholder = 'Search...',
}: AdminTableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const handleClear = () => {
    setLocalSearch('');
    onClearFilters();
  };

  const hasActiveFilters = localSearch !== '' || Object.values(filterValues).some((val) => val !== '');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-4">
      {/* Search Input */}
      {filters.some(f => f.type === 'search') && (
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 w-full bg-background"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      )}

      {/* Select & Date Filters */}
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
        {filters.filter(f => f.type !== 'search').map((filter) => {
          if (filter.type === 'select') {
            return (
              <select
                key={filter.id}
                value={filterValues[filter.id] || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0"
              >
                <option value="">{filter.placeholder || `All ${filter.id}`}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );
          }
          if (filter.type === 'date') {
            return (
              <Input
                key={filter.id}
                type="date"
                value={filterValues[filter.id] || ''}
                onChange={(e) => onFilterChange(filter.id, e.target.value)}
                className="h-10 w-auto bg-background shrink-0"
              />
            );
          }
          return null;
        })}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={handleClear} className="h-10 w-10 shrink-0" title="Clear filters">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

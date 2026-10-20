import React from 'react';
import { TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface SortableTableHeadProps {
  label: React.ReactNode;
  sortKey: string;
  currentSortBy?: string;
  currentSortOrder?: 'ASC' | 'DESC';
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHead({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isSorted = currentSortBy === sortKey;

  let ariaSort: 'ascending' | 'descending' | 'none' = 'none';
  if (isSorted) {
    ariaSort = currentSortOrder === 'DESC' ? 'descending' : 'ascending';
  }

  return (
    <TableHead className={className} aria-sort={ariaSort}>
      <Button
        variant="ghost"
        onClick={() => onSort(sortKey)}
        className="-ml-4 hover:bg-transparent"
        aria-label={`Sort by ${typeof label === 'string' ? label : sortKey}, currently ${ariaSort}`}
      >
        {label}
        {isSorted ? (
          <ArrowUpDown
            className={`ml-2 h-4 w-4 transition-transform ${
              currentSortOrder === 'DESC' ? 'rotate-180' : ''
            }`}
          />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />
        )}
      </Button>
    </TableHead>
  );
}

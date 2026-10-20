'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>> | ((open: boolean) => void);
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface PopoverContentProps {
  align?: 'start' | 'center' | 'end';
  className?: string;
  children: React.ReactNode;
  onOpenAutoFocus?: (e: any) => void;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => {},
});

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const newValue = typeof value === 'function' ? value(open) : value;
      if (controlledOpen === undefined) setInternalOpen(newValue);
      onOpenChange?.(newValue);
    },
    [controlledOpen, open, onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen: setOpen as any }}>
      <div className="relative inline-block text-left">{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { setOpen } = React.useContext(PopoverContext);
  return (
    <div onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
      {children}
    </div>
  );
}

export function PopoverContent({
  align = 'center',
  className,
  children,
}: PopoverContentProps) {
  const { open, setOpen } = React.useContext(PopoverContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const alignStyles = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full mt-2 z-50 rounded-xl bg-popover text-popover-foreground shadow-2xl border border-border animate-in fade-in-0 zoom-in-95',
        alignStyles[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

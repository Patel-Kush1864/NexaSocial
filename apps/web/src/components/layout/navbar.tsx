'use client';

import { useSidebarStore } from '@/stores/sidebar-store';
import { useTheme } from 'next-themes';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun } from 'lucide-react';
import { GlobalSearch } from './global-search';

export function Navbar() {
  const { toggleMobile } = useSidebarStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobile}
          className="md:hidden h-9 w-9 text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-10 w-10 rounded-full border border-border/40 hover:bg-accent/50"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-violet-400" />
        </Button>

        {/* Real-time Notification Bell */}
        <NotificationBell />

        <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}

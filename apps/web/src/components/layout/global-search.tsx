'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { queryKeys } from '@/lib/query-client';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function GlobalSearch() {
  const { scope } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const isPlatform = scope === 'PLATFORM';
  
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.search(debouncedQuery),
    queryFn: () => searchService.platformSearch(debouncedQuery),
    enabled: isPlatform && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Preserve existing workspace search behavior
  if (!isPlatform) {
    return (
      <div className="relative hidden sm:flex items-center w-64 md:w-80">
        <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search streams, accounts, settings..."
          className="pl-9 h-9 text-xs bg-muted/40 border-border/40 focus-visible:bg-background"
        />
      </div>
    );
  }

  const hasResults =
    data?.results &&
    Object.values(data.results).some((arr) => arr && arr.length > 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative hidden sm:flex items-center w-64 md:w-80 cursor-pointer">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search NexaSocial..."
            className="pl-9 h-9 text-xs bg-muted/40 border-border/40 focus-visible:bg-background cursor-text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
      </PopoverTrigger>
      
      {query.length >= 2 && (
        <PopoverContent
          className="w-[320px] md:w-[400px] p-0 shadow-xl border-border/50 bg-background/95 backdrop-blur-md"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Searching NexaSocial...</span>
              </div>
            )}

            {isError && !isLoading && (
              <div className="p-4 text-center text-sm text-destructive">
                Search unavailable. Please try again.
              </div>
            )}

            {!isLoading && !isError && !hasResults && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No results found for &quot;{debouncedQuery}&quot;
              </div>
            )}

            {!isLoading && !isError && hasResults && (
              <div className="space-y-4">
                {/* Users */}
                {data.results.users && data.results.users.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Users
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.users.map((u) => (
                        <Link
                          key={u.id}
                          href={`/users/${u.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workspaces */}
                {data.results.workspaces && data.results.workspaces.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Workspaces
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.workspaces.map((w) => (
                        <Link
                          key={w.id}
                          href={`/workspaces/${w.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{w.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{w.status.toLowerCase()}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscriptions */}
                {data.results.subscriptions && data.results.subscriptions.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Subscriptions
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.subscriptions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/subscriptions/${s.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{s.userName}</div>
                          <div className="text-xs text-muted-foreground">{s.planName} • {s.status}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payments */}
                {data.results.payments && data.results.payments.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Payments
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.payments.map((p) => (
                        <Link
                          key={p.id}
                          href={`/payments/${p.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{p.transactionId}</div>
                          <div className="text-xs text-muted-foreground">${p.amount} • {p.status}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Streams */}
                {data.results.liveStreams && data.results.liveStreams.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Live Streams
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.liveStreams.map((s) => (
                        <Link
                          key={s.id}
                          href={`/streams/${s.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{s.platform}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Accounts */}
                {data.results.socialAccounts && data.results.socialAccounts.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Social Accounts
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.socialAccounts.map((a) => (
                        <Link
                          key={a.id}
                          href={`/social`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{a.accountName}</div>
                          <div className="text-xs text-muted-foreground">{a.platform}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings */}
                {data.results.settings && data.results.settings.length > 0 && (
                  <div>
                    <h3 className="px-2 py-1 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      Settings
                    </h3>
                    <div className="space-y-1 mt-1">
                      {data.results.settings.map((s) => (
                        <Link
                          key={s.id}
                          href={`/settings`}
                          onClick={() => setIsOpen(false)}
                          className="block px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                        >
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.description}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

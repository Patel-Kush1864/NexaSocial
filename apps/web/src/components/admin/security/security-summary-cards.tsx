'use client';

import { useSecuritySummary } from '@/hooks/use-security';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, KeyRound, AlertTriangle, Users, Lock, Activity } from 'lucide-react';

export function SecuritySummaryCards() {
  const { data: summary, isLoading, isError } = useSecuritySummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !summary) {
    return null;
  }

  const items = [
    {
      title: 'Security Events',
      value: summary.securityEvents,
      icon: Activity,
      color: 'text-blue-500',
    },
    {
      title: 'Active Sessions',
      value: summary.activeSessions,
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Admin Logins',
      value: summary.adminLogins,
      icon: Shield,
      color: 'text-indigo-500',
    },
    {
      title: 'Failed Logins',
      value: summary.failedLogins,
      icon: KeyRound,
      color: 'text-orange-500',
    },
    {
      title: 'Suspicious',
      value: summary.suspiciousActivity,
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      title: 'Privileged',
      value: summary.privilegedActions,
      icon: Lock,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <Icon className={`w-4 h-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

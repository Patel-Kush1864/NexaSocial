'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PlanCard } from '@/components/cards/plan-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function BillingPage() {
  const handleUpgrade = (planName: string) => {
    toast.success(`Redirecting to checkout for ${planName} plan...`);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription tier, billing interval, and view payment receipts."
      />

      {/* Current Active Plan Overview */}
      <Card className="glass-panel border-border/50 bg-gradient-to-r from-violet-950/30 to-indigo-950/30">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold">Pro Plan Active</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Your subscription renews automatically on August 25, 2026.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-black">$49/mo</span>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Available SaaS Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            name="Starter"
            tier="STARTER"
            price={19}
            interval="MONTHLY"
            features={[
              'Up to 3 Social Accounts',
              '720p Single Stream Output',
              'Basic Audience Analytics',
              '1 Workspace & 2 Members',
            ]}
          />
          <PlanCard
            name="Pro"
            tier="PRO"
            price={49}
            interval="MONTHLY"
            isCurrent={true}
            features={[
              'Up to 15 Social Accounts',
              '1080p Multi-Destination Stream',
              'Advanced Cross-Platform Analytics',
              '5 Workspaces & 10 Members',
              'Real-Time WebSocket Chat Feed',
            ]}
          />
          <PlanCard
            name="Enterprise"
            tier="ENTERPRISE"
            price={199}
            interval="MONTHLY"
            onSelect={() => handleUpgrade('Enterprise')}
            features={[
              'Unlimited Social Channels',
              '4K Ultra-HD Broadcasting',
              'Custom RTMP Server Nodes',
              'Unlimited Workspaces & Teams',
              'Dedicated 24/7 Priority Support',
            ]}
          />
        </div>
      </div>

      {/* Payment History Table */}
      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-violet-400" />
            Payment History & Invoices
          </CardTitle>
          <CardDescription className="text-xs">
            Download PDF receipts for tax and accounting purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            {[
              { date: 'Jul 25, 2026', amount: '$49.00', status: 'Paid', invoice: 'INV-2026-001' },
              { date: 'Jun 25, 2026', amount: '$49.00', status: 'Paid', invoice: 'INV-2026-002' },
              { date: 'May 25, 2026', amount: '$49.00', status: 'Paid', invoice: 'INV-2026-003' },
            ].map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/30"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">{p.invoice}</p>
                  <p className="text-[10px] text-muted-foreground">{p.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">{p.amount}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;

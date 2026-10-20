'use client';

import { AdminPlan } from '@/types';
import { PlanStatusBadge } from './PlanStatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit,
  Play,
  Pause,
  Archive,
  Eye,
  Sparkles,
  Layers,
  Users,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlansTableProps {
  plans: AdminPlan[];
  onEdit: (plan: AdminPlan) => void;
  onPreview: (plan: AdminPlan) => void;
  onActivate: (id: string, currentStatus: string) => void;
  onDeactivate: (id: string) => void;
  onArchive: (plan: AdminPlan) => void;
}

export function PlansTable({
  plans,
  onEdit,
  onPreview,
  onActivate,
  onDeactivate,
  onArchive,
}: PlansTableProps) {
  const formatLimit = (val: number | undefined) => {
    if (val === -1) return '∞';
    if (val === undefined || val === null) return '0';
    return val.toString();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-lg">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-white/50 uppercase bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold">Plan Details</th>
              <th className="px-6 py-4 font-semibold">Pricing & Duration</th>
              <th className="px-6 py-4 font-semibold">Subscribers</th>
              <th className="px-6 py-4 font-semibold">Limits (Acc / Ws / Seats)</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/50">
                  No subscription plans found matching your filter criteria.
                </td>
              </tr>
            ) : (
              plans.map((plan) => {
                const currencySymbol = plan.currency === 'USD' ? '$' : '₹';
                const intervalLabel =
                  plan.billingCycle === 'YEARLY'
                    ? '/yr'
                    : plan.billingCycle === 'QUARTERLY'
                      ? '/quarter'
                      : '/mo';

                return (
                  <tr
                    key={plan.id}
                    className="hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    {/* Plan Name & Code */}
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{plan.name}</span>
                          {plan.isPopular && (
                            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] py-0 px-1.5 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {plan.code && (
                            <span className="text-[11px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                              {plan.code}
                            </span>
                          )}
                          {plan.displayOrder !== undefined && plan.displayOrder > 0 && (
                            <span className="text-[10px] text-gray-500">
                              Order: #{plan.displayOrder}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Pricing & Duration */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {Number(plan.price) === 0 ? 'Free' : `${currencySymbol}${Number(plan.price).toLocaleString()}`}
                          {Number(plan.price) > 0 && (
                            <span className="text-xs text-muted-foreground font-normal">
                              {intervalLabel}
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {plan.billingType === 'ONE_TIME' ? 'One-time pass' : 'Recurring'}
                          {plan.durationDays ? ` (${plan.durationDays}d)` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Active Subscribers */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <Users className="w-3.5 h-3.5 text-violet-400" />
                        <span>{(plan.subscriberCount || 0).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Limits */}
                    <td className="px-6 py-4 text-white/80">
                      <div className="flex flex-col gap-0.5 text-xs font-mono">
                        <span>
                          {formatLimit(plan.socialAccountLimit)} accounts · {formatLimit(plan.workspaceLimit)} ws · {formatLimit(plan.teamMemberLimit)} seats
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {formatLimit(plan.liveStreamLimit)} streams · {formatLimit(plan.storageLimit)}GB
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <PlanStatusBadge status={plan.status} />
                    </td>

                    {/* Actions Menu */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreview(plan)}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-white hover:bg-white/10"
                          title="Preview pricing card"
                        >
                          <Eye className="h-4 w-4 mr-1 text-cyan-400" />
                          Preview
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-gray-950 border-white/10 text-white shadow-xl">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Plan Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />

                            <DropdownMenuItem onClick={() => onPreview(plan)} className="cursor-pointer hover:bg-white/10 text-xs">
                              <Eye className="mr-2 h-3.5 w-3.5 text-cyan-400" />
                              Preview Card
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onEdit(plan)} className="cursor-pointer hover:bg-white/10 text-xs">
                              <Edit className="mr-2 h-3.5 w-3.5 text-violet-400" />
                              Edit Plan Details
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/10" />

                            {plan.status !== 'ACTIVE' ? (
                              <DropdownMenuItem
                                onClick={() => onActivate(plan.id, plan.status)}
                                className="cursor-pointer hover:bg-white/10 text-emerald-400 text-xs"
                              >
                                <Play className="mr-2 h-3.5 w-3.5" />
                                Activate Plan
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => onDeactivate(plan.id)}
                                className="cursor-pointer hover:bg-white/10 text-amber-400 text-xs"
                              >
                                <Pause className="mr-2 h-3.5 w-3.5" />
                                Deactivate Plan
                              </DropdownMenuItem>
                            )}

                            {plan.status !== 'ARCHIVED' && (
                              <DropdownMenuItem
                                onClick={() => onArchive(plan)}
                                className="cursor-pointer hover:bg-white/10 text-rose-400 text-xs"
                              >
                                <Archive className="mr-2 h-3.5 w-3.5" />
                                Archive Plan
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

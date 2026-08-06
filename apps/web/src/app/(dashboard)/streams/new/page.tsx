'use client';

import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useStreams } from '@/hooks/use-streams';
import { useSocialAccounts } from '@/hooks/use-social';
import { createStreamSchema, type CreateStreamFormValues } from '@/lib/validators';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Radio, Check } from 'lucide-react';
import { PLATFORM_CONFIG } from '@/lib/constants';

export default function NewStreamPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const { createStream, isCreating } = useStreams(currentWorkspace?.id);
  const { accounts } = useSocialAccounts(currentWorkspace?.id);

  const form = useForm<CreateStreamFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createStreamSchema as any),
    defaultValues: {
      title: '',
      description: '',
      platformAccountIds: [],
    },
  });

  const selectedPlatformIds = useWatch({
    control: form.control,
    name: 'platformAccountIds',
  }) || [];

  const togglePlatform = (id: string) => {
    const current = new Set(selectedPlatformIds);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    form.setValue('platformAccountIds', Array.from(current));
  };

  const onSubmit = async (data: CreateStreamFormValues) => {
    if (!currentWorkspace) return;
    try {
      const stream = await createStream({
        workspaceId: currentWorkspace.id,
        payload: {
          title: data.title,
          description: data.description,
          platformAccountIds: data.platformAccountIds,
          connectedAccountIds: data.platformAccountIds,
        },
      });
      router.push(`/streams/${stream.id}`);
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <PageHeader
        title="Create Live Stream Studio"
        description="Set up a multi-destination live broadcast session across your connected social channels."
      />

      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="stream-title">Stream Title</Label>
              <Input
                id="stream-title"
                placeholder="e.g., Weekly Product Keynote & QA Session"
                {...form.register('title')}
                className="bg-background/50"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-desc">Description (Optional)</Label>
              <textarea
                id="stream-desc"
                rows={4}
                placeholder="Describe your live stream content, links, and hashtags..."
                {...form.register('description')}
                className="w-full p-3 rounded-md bg-background/50 border border-input text-xs font-medium focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Select Broadcasting Destinations</Label>
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No connected social accounts found in this workspace. Please connect a YouTube or Twitch account first.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accounts.map((acc) => {
                    const isSelected = selectedPlatformIds.includes(acc.id);
                    const config = PLATFORM_CONFIG[acc.platform];

                    return (
                      <div
                        key={acc.id}
                        onClick={() => togglePlatform(acc.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'bg-accent/20 border-border/40 hover:bg-accent/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-linear-to-tr ${config.gradient} flex items-center justify-center text-white text-sm`}>
                            {config.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-none">{acc.accountName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{config.name}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {form.formState.errors.platformAccountIds && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.platformAccountIds.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-linear-to-r from-violet-600 to-indigo-600 font-semibold shadow-lg shadow-violet-500/20"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing Studio...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 mr-2" />
                    Create Stream Studio
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

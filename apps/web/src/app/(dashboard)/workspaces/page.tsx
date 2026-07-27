'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/hooks/use-workspace';
import { PageHeader } from '@/components/shared/page-header';
import { CreateWorkspaceDialog } from '@/components/dialogs/create-workspace-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Building2, Plus, Users, ArrowRight, Check } from 'lucide-react';

export function WorkspacesPage() {
  const { currentWorkspace, workspaces, isLoading, switchWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading workspaces..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspaces"
        description="Organize team members, social accounts, and live stream channels."
        action={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            Create Workspace
          </Button>
        }
      />

      {workspaces.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Workspaces Found"
          description="Create your first workspace to start connecting social accounts and scheduling live streams."
          actionLabel="Create Workspace"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            const isCurrent = currentWorkspace?.id === ws.id;

            return (
              <Card
                key={ws.id}
                className={`glass-panel border-border/50 transition-all group ${
                  isCurrent ? 'ring-2 ring-primary/60 border-primary/50' : 'hover:border-primary/40'
                }`}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-violet-500/20">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">{ws.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      slug: {ws.slug}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ws.description || 'Enterprise social media management workspace.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>Members</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => switchWorkspace(ws.id)}
                          className="h-8 text-xs text-primary font-semibold"
                        >
                          Switch
                        </Button>
                      )}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold"
                      >
                        <Link href={`/workspaces/${ws.id}`}>
                          Manage
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

export default WorkspacesPage;

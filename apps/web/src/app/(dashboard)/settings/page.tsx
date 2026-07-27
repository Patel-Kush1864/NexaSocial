'use client';

import { PageHeader } from '@/components/shared/page-header';
import { ProfileForm } from '@/components/forms/profile-form';
import { SecurityForm } from '@/components/forms/security-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Shield, Laptop } from 'lucide-react';
import { useState } from 'react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Account Settings"
        description="Manage your personal profile, security preferences, and active sessions."
      />

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:bg-accent/40'
          }`}
        >
          <User className="w-4 h-4" />
          Profile Details
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:bg-accent/40'
          }`}
        >
          <Shield className="w-4 h-4" />
          Password & Security
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'sessions'
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:bg-accent/40'
          }`}
        >
          <Laptop className="w-4 h-4" />
          Active Sessions
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
            <CardDescription className="text-xs">
              Update your name, bio, photo avatar, and primary timezone settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Change Account Password</CardTitle>
            <CardDescription className="text-xs">
              Ensure your account uses a strong password with letters, numbers, and symbols.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityForm />
          </CardContent>
        </Card>
      )}

      {activeTab === 'sessions' && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Active Device Sessions</CardTitle>
            <CardDescription className="text-xs">
              Devices currently logged into your NexaSocial account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-accent/30 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Laptop className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs font-bold leading-none">Windows PC — Chrome Browser</p>
                  <p className="text-[10px] text-muted-foreground mt-1">IP: 192.168.1.1 (Current Session)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active Now
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SettingsPage;

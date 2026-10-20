'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  ShieldAlert,
  Radio,
  Share2,
  Users,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export function EmailPreferencesForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    streamingEmails: true,
    socialEmails: true,
    workspaceEmails: true,
    marketingEmails: false,
  });

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data } = await apiClient.get('/email/preferences');
        if (data) {
          setPreferences({
            streamingEmails: data.streamingEmails ?? true,
            socialEmails: data.socialEmails ?? true,
            workspaceEmails: data.workspaceEmails ?? true,
            marketingEmails: data.marketingEmails ?? false,
          });
        }
      } catch (err: any) {
        // Defaults stay active if first time
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/email/preferences', preferences);
      toast.success('Email preferences updated successfully!');
    } catch (err: any) {
      toast.error('Failed to update email preferences: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-muted-foreground text-xs gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Essential Emails Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-foreground">Mandatory Transactional & Security Notices</p>
          <p className="text-muted-foreground mt-0.5">
            Security alerts, password resets, email verification, subscription renewals, and Razorpay payment confirmations are critical and will always be delivered to your inbox.
          </p>
        </div>
      </div>

      {/* Preference Toggles */}
      <div className="space-y-4">
        {/* Streaming */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Live Streaming Alerts</p>
              <p className="text-[11px] text-muted-foreground">
                Notifications when streams start, end, fail, or upcoming scheduled reminders.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('streamingEmails')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
              preferences.streamingEmails ? 'bg-primary justify-end' : 'bg-muted justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Social */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Social Accounts & Channels</p>
              <p className="text-[11px] text-muted-foreground">
                Alerts when accounts are connected, disconnected, or require token re-authorization.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('socialEmails')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
              preferences.socialEmails ? 'bg-primary justify-end' : 'bg-muted justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Workspace */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Workspace & Team Activity</p>
              <p className="text-[11px] text-muted-foreground">
                Invites to new workspaces, role updates, and member status notifications.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('workspaceEmails')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
              preferences.workspaceEmails ? 'bg-primary justify-end' : 'bg-muted justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Marketing */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Product Updates & Tips</p>
              <p className="text-[11px] text-muted-foreground">
                Occasional product announcements, new features, and creator best-practice guides.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('marketingEmails')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
              preferences.marketingEmails ? 'bg-primary justify-end' : 'bg-muted justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="text-xs gap-1.5"
        >
          {saving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" /> Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

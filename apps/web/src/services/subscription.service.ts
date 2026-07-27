// ═══════════════════════════════════════════
// NexaSocial — Subscription API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { Subscription } from '@/types';

export const subscriptionService = {
  async getCurrent(): Promise<Subscription> {
    const { data } = await apiClient.get<Subscription>(
      '/subscriptions/current',
    );
    return data;
  },

  async getHistory(): Promise<Subscription[]> {
    const { data } = await apiClient.get<Subscription[]>(
      '/subscriptions/history',
    );
    return data;
  },

  async purchase(planId: string, gateway?: string) {
    const { data } = await apiClient.post('/subscriptions/purchase', {
      planId,
      gateway,
    });
    return data;
  },

  async cancel(): Promise<Subscription> {
    const { data } = await apiClient.post<Subscription>(
      '/subscriptions/cancel',
    );
    return data;
  },

  async upgrade(planId: string): Promise<Subscription> {
    const { data } = await apiClient.post<Subscription>(
      '/subscriptions/upgrade',
      { planId },
    );
    return data;
  },

  async downgrade(planId: string): Promise<Subscription> {
    const { data } = await apiClient.post<Subscription>(
      '/subscriptions/downgrade',
      { planId },
    );
    return data;
  },

  async renew(): Promise<Subscription> {
    const { data } = await apiClient.post<Subscription>(
      '/subscriptions/renew',
    );
    return data;
  },
};

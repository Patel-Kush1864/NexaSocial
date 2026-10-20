/* eslint-disable @typescript-eslint/no-explicit-any */
// ═══════════════════════════════════════════
// NexaSocial — Subscription API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { Subscription, SubscriptionEntitlements } from '@/types';

export const subscriptionService = {
  async getEntitlements(): Promise<SubscriptionEntitlements> {
    const { data } = await apiClient.get<SubscriptionEntitlements>(
      '/subscriptions/entitlements',
    );
    return data;
  },

  async getPublicPlans(): Promise<any[]> {
    const { data } = await apiClient.get<any[]>('/plans');
    return data;
  },

  async getPaymentHistory(): Promise<any[]> {
    const { data } = await apiClient.get<any[]>('/payments/history');
    return data;
  },

  async createPaymentOrder(planId: string, gateway: 'RAZORPAY' | 'STRIPE' = 'RAZORPAY') {
    const { data } = await apiClient.post<{
      paymentId: string;
      gatewayOrderId: string;
      amount: number;
      currency: string;
      gateway: string;
      keyId?: string;
    }>('/payments/create-order', {
      planId,
      gateway,
    });
    return data;
  },

  async verifyPayment(payload: {
    gateway: 'RAZORPAY' | 'STRIPE';
    gatewayOrderId?: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
  }) {
    const { data } = await apiClient.post('/payments/verify', payload);
    return data;
  },

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

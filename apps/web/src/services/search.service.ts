// ═══════════════════════════════════════════
// NexaSocial — Search API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';

export interface SearchResults {
  users?: { id: string; name: string; email: string; status: string }[];
  workspaces?: { id: string; name: string; status: string }[];
  subscriptions?: { id: string; planName: string; userName: string; status: string }[];
  liveStreams?: { id: string; title: string; platform: string; status: string }[];
  socialAccounts?: { id: string; accountName: string; platform: string; status: string }[];
  payments?: { id: string; transactionId: string; amount: string; status: string; createdAt: string }[];
  settings?: { id: string; name: string; description: string }[];
}

export interface SearchResponse {
  query: string;
  results: SearchResults;
}

export const searchService = {
  async platformSearch(query: string): Promise<SearchResponse> {
    const { data } = await apiClient.get<SearchResponse>('/admin/search', {
      params: { q: query },
    });
    return data;
  },
};

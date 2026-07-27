// ═══════════════════════════════════════════
// NexaSocial — Axios API Client
// ═══════════════════════════════════════════

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError, TokenResponse } from '@/types';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:3001';
};

// Create the Axios instance
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Token Management ──────────────────────
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Request Interceptor ───────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor (Auto-Refresh) ───
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Deduplicate concurrent refresh requests
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          setAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        refreshPromise = null;
        // Clear auth state on refresh failure
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// ── Refresh Token Helper ──────────────────
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('nexasocial_refresh_token')
        : null;

    if (!refreshToken) return null;

    const response = await axios.post<TokenResponse>(
      `${getApiBaseUrl()}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const { accessToken: newAccess, refreshToken: newRefresh } =
      response.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('nexasocial_refresh_token', newRefresh);
    }

    return newAccess;
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexasocial_refresh_token');
    }
    return null;
  }
}

export default apiClient;

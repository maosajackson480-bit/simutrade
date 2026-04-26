// SimuTrade API Configuration 
// Base URL for all API calls to the Render backend

export const API_BASE_URL = 'https://simutrade-jnem.onrender.com';

/**
 * Simple reusable API helper for all backend calls
 * - Automatically prepends the base URL
 * - Adds Content-Type header
 * - Includes credentials for cookies
 * - Includes auth token if available
 * - Throws on non-OK responses with error message
 */
export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  // Get auth token from localStorage
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('derivToken') 
    : null;

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add auth token if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `API Error: ${res.status}`);
  }

  return res.json();
};

// API Endpoints (UPDATED)
export const ENDPOINTS = {
  // Authentication
  login: '/login',
  logout: '/logout',
  
  // Bot operations
  startBot: '/api/bot/start',
  stopBot: '/api/bot/stop',
  botStatus: '/api/bot/status',
  
  // User data
  profile: '/api/profile',
  notifications: '/api/notifications',
  balance: '/api/balance',
  
  // Trading
  switchMode: '/api/switch-mode',
  import: '/api/import',
  
  // Manual trading
  startManualTrading: '/api/manual/start',
  
  // Reports
  reports: '/api/reports',
};

// Helper to clear auth and return to login
export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('derivToken');
    localStorage.removeItem('simutrade_user');
  }
};

// Helper to save auth token
export const saveAuth = (token: string, user?: { email: string }) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('derivToken', token);
    if (user) {
      localStorage.setItem('simutrade_user', JSON.stringify(user));
    }
  }
};

// Helper to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('derivToken');
  }
  return false;
};
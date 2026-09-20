/**
 * CreatorProof API Client
 * Centralized HTTP client for backend REST API communication.
 */

// Dynamically determine API Base URL
// In development with Vite proxy, '/api' proxies to http://localhost:3000.
// In production served by Express, '/api' is on the same origin.
const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
    return (window as any).API_BASE_URL.replace(/\/+$/, '');
  }

  return '/api';
};

export const getAuthToken = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('creatorproof_token') || localStorage.getItem('authToken');
};

export const setAuthToken = (token: string | null): void => {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem('creatorproof_token', token);
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('creatorproof_token');
    localStorage.removeItem('authToken');
  }
};

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const base = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  const activeToken = token !== undefined ? token : getAuthToken();
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  // Do not set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response from server' }));

    if (!res.ok || data.success === false) {
      const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg) as Error & { status?: number; data?: any };
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err: any) {
    // If connection refused on proxy, provide clear diagnostic message
    if (err.message && err.message.includes('Failed to fetch')) {
      console.error(`[API Client] Cannot reach server at ${url}. Ensure the backend server is running on port 3000.`);
    }
    throw err;
  }
}

export const api = {
  auth: {
    signup: async (payload: {
      email: string;
      password: string;
      name: string;
      username: string;
      phone?: string;
      website?: string;
      bio?: string;
    }) => {
      return request<{ success: boolean; token: string; user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, null);
    },

    login: async (identifier: string, password: string) => {
      return request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, email: identifier, password })
      }, null);
    },

    getMe: async (token?: string | null) => {
      return request<{ success: boolean; user: any }>('/auth/me', {
        method: 'GET'
      }, token);
    },

    updateProfile: async (payload: { name?: string; phone?: string; website?: string; bio?: string }) => {
      return request<{ success: boolean; user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    }
  },

  content: {
    register: async (formData: FormData) => {
      return request<{ success: boolean; data: any }>('/content/register', {
        method: 'POST',
        body: formData
      });
    },

    getAll: async () => {
      return request<{ success: boolean; data: any[] }>('/content', {
        method: 'GET'
      });
    },

    getById: async (id: string) => {
      return request<{ success: boolean; data: any }>(`/content/${encodeURIComponent(id)}`, {
        method: 'GET'
      });
    },

    delete: async (id: string) => {
      return request<{ success: boolean; message?: string }>(`/content/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    },

    verify: async (payload: { contentId?: string; sha256Hash?: string }) => {
      return request<{
        success: boolean;
        verified: boolean;
        matchType?: string;
        data?: any;
        reason?: string;
      }>('/content/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, null);
    }
  },

  licenses: {
    create: async (payload: {
      contentId: string;
      licensee: string;
      licenseeEmail?: string;
      type: string;
      expiryDate: string;
      permissions?: string;
    }) => {
      return request<{ success: boolean; data: any }>('/licenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    getAll: async () => {
      return request<{ success: boolean; data: any[] }>('/licenses', {
        method: 'GET'
      });
    },

    updateStatus: async (id: string, status: string) => {
      return request<{ success: boolean; data: any }>(`/licenses/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    delete: async (id: string) => {
      return request<{ success: boolean; message?: string }>(`/licenses/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    }
  },

  disputes: {
    create: async (payload: {
      contentId: string;
      claimant: string;
      claimantEmail?: string;
      type: string;
      description: string;
      evidence?: string;
    }) => {
      return request<{ success: boolean; data: any }>('/disputes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    getAll: async () => {
      return request<{ success: boolean; data: any[] }>('/disputes', {
        method: 'GET'
      });
    },

    updateStatus: async (id: string, status: string, resolutionNotes?: string) => {
      return request<{ success: boolean; data: any }>(`/disputes/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes })
      });
    },

    delete: async (id: string) => {
      return request<{ success: boolean; message?: string }>(`/disputes/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    }
  }
};

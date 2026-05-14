import { supabase } from './supabase';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;
  
  // Fallback to localStorage for guest/dev mode
  return localStorage.getItem('studysync_user_id');
};

export const api = {
  get: async (endpoint: string) => {
    const userId = await getUserId();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${userId ? `${separator}userId=${userId}` : ''}`;
    console.log(`[API GET] Calling: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown Error');
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.response || errorData.error || errorText);
      } catch {
        throw new Error(errorText || 'API request failed');
      }
    }
    return response.json();
  },
  post: async (endpoint: string, data: any) => {
    const userId = await getUserId();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${userId ? `${separator}userId=${userId}` : ''}`;
    console.log(`[API POST] Calling: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown Error');
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.response || errorData.error || errorText);
      } catch {
        throw new Error(errorText || 'API request failed');
      }
    }
    return response.json();
  },
  put: async (endpoint: string, data: any) => {
    const userId = await getUserId();
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${API_BASE_URL}${endpoint}${userId ? `${separator}userId=${userId}` : ''}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.response || errorData.error || 'API request failed');
    }
    return response.json();
  },
  delete: async (endpoint: string) => {
    const userId = await getUserId();
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${API_BASE_URL}${endpoint}${userId ? `${separator}userId=${userId}` : ''}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.response || errorData.error || 'API request failed');
    }
    return response.json();
  },
};

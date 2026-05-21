import { useState, useCallback } from 'react';

const API_BASE = '/api';

let _accessToken = localStorage.getItem('access_token');
let _refreshToken = localStorage.getItem('refresh_token');
let _refreshPromise = null;

export function setTokens(access, refresh) {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem('access_token', access || '');
  localStorage.setItem('refresh_token', refresh || '');
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken() { return _accessToken; }
export function getRefreshToken() { return _refreshToken; }

async function refreshTokens() {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: _refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && _refreshToken) {
    const ok = await refreshTokens();
    if (ok) {
      headers['Authorization'] = `Bearer ${_accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  return res;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(path, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error, setError };
}

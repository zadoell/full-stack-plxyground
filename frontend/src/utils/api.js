// API client with auth header support
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3011';

let _token = null;
let _onAuthExpired = null; // callback set by AuthContext to trigger logout on 401

export function setToken(token) { _token = token; }
export function getToken() { return _token; }
export function clearToken() { _token = null; }
export function setAuthExpiredCallback(fn) { _onAuthExpired = fn; }

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Expired or invalid token — clear local session so UI reflects reality
    if (res.status === 401 && data.code === 'TOKEN_INVALID') {
      clearToken();
      if (_onAuthExpired) _onAuthExpired();
    }
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),

  /** Upload a file (multipart/form-data). Returns { url, path, ... } */
  upload: async (uri, filename, mimeType) => {
    const url = `${API_BASE}/api/upload`;
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // On web, expo-image-picker returns a blob: URI — fetch it and wrap in a File
      const blobRes = await fetch(uri);
      const blob = await blobRes.blob();
      const file = new File([blob], filename, { type: mimeType });
      formData.append('file', file);
    } else {
      // React Native native: { uri, name, type } is handled by the native fetch layer
      formData.append('file', { uri, name: filename, type: mimeType });
    }

    const headers = {};
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    // Do NOT set Content-Type – fetch/FormData sets the multipart boundary automatically

    const res = await fetch(url, { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `Upload failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  },
};

export default api;

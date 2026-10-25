/**
 * API configuration and helper for SPK Nuansa Wangi.
 * Uses VITE_API_BASE_URL when deployed (e.g. Vercel -> Cloud API),
 * or falls back to empty string in development to leverage Vite dev proxy (/api -> localhost:3002).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * Returns full URL for an API endpoint path.
 * Example: apiUrl('/api/auth/login') -> 'https://cloud-api.domain/api/auth/login' or '/api/auth/login'
 * @param {string} path
 * @returns {string}
 */
export function apiUrl(path = '') {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

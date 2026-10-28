import { SESSION_COOKIE_NAME, verifySessionToken } from '../services/authService.js';

export function getCookie(request, name) {
  const prefix = `${name}=`;
  const value = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!value) return null;
  try {
    return decodeURIComponent(value.slice(prefix.length));
  } catch {
    return null;
  }
}

export function requireAuth(request, response, next, env = process.env) {
  const session = verifySessionToken(getCookie(request, SESSION_COOKIE_NAME), env);
  if (!session) {
    return response.status(401).json({ error: 'UNAUTHENTICATED', message: 'Silakan masuk untuk melanjutkan.' });
  }
  request.user = session;
  return next();
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({ error: 'UNAUTHENTICATED', message: 'Silakan masuk untuk melanjutkan.' });
    }
    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ error: 'FORBIDDEN', message: 'Akses tidak diizinkan untuk peran Anda.' });
    }
    return next();
  };
}

export function sessionCookieOptions(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const sameSite = env.COOKIE_SAMESITE || 'strict';
  const secure = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : (sameSite.toLowerCase() === 'none' ? true : isProduction);
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

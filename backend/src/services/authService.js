import { createHmac, randomBytes, scrypt, timingSafeEqual, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
export const SESSION_COOKIE_NAME = 'spk_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
const HASH_PREFIX = 'scrypt$32768$8$1$';
const activeSessions = new Map();

function configuredUsers(env) {
  return [
    {
      username: env.AUTH_ADMIN_USERNAME?.trim(),
      passwordHash: env.AUTH_ADMIN_PASSWORD_HASH?.trim(),
      role: 'ADMIN',
      name: 'Administrator',
    },
    {
      username: env.AUTH_LEADER_USERNAME?.trim(),
      passwordHash: env.AUTH_LEADER_PASSWORD_HASH?.trim(),
      role: 'LEADER',
      name: 'Pimpinan',
    },
  ].filter((user) => user.username && user.passwordHash);
}

export function isAuthConfigured(env = process.env) {
  const users = configuredUsers(env);
  const hashPattern = /^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/;
  return Boolean(env.SESSION_SECRET && Buffer.byteLength(env.SESSION_SECRET) >= 32)
    && users.length === 2
    && users[0].username.toLowerCase() !== users[1].username.toLowerCase()
    && users.every((user) => hashPattern.test(user.passwordHash));
}

export async function authenticateUser(username, password, env = process.env) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const user = configuredUsers(env).find((entry) => entry.username.toLowerCase() === normalizedUsername);
  if (!user || typeof password !== 'string' || password.length > 1024) return null;

  if (!await verifyPasswordHash(password, user.passwordHash)) return null;
  return { username: user.username, name: user.name, role: user.role };
}

export async function authenticateDatabaseUser(pool, username, password) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (!normalizedUsername || typeof password !== 'string' || password.length > 1024) return null;
  const [rows] = await pool.execute('SELECT username, password_hash, name, role FROM users WHERE LOWER(username) = ? AND is_active = 1 LIMIT 1', [normalizedUsername]);
  const user = rows[0];
  if (!user || !await verifyPasswordHash(password, user.password_hash)) return null;
  return { username: user.username, name: user.name, role: user.role };
}

export async function verifyPasswordHash(password, passwordHash) {
  if (typeof password !== 'string' || typeof passwordHash !== 'string') return false;
  const parts = passwordHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || parts[1] !== '32768' || parts[2] !== '8' || parts[3] !== '1') return false;
  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[4], 'base64url');
    expected = Buffer.from(parts[5], 'base64url');
  } catch {
    return false;
  }
  if (salt.length < 16 || expected.length !== 64) return false;

  let actual;
  try {
    actual = await scryptAsync(password, salt, expected.length, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  } catch {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

export function invalidateAllSessions() { activeSessions.clear(); }

export function createSessionToken(user, env = process.env, now = Date.now()) {
  const secret = env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('SESSION_SECRET is not configured');
  const sid = randomUUID();
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  for (const [activeSid, expiresAt] of activeSessions) {
    if (expiresAt <= Math.floor(now / 1000)) activeSessions.delete(activeSid);
  }
  activeSessions.set(sid, exp);
  const payload = Buffer.from(JSON.stringify({
    sub: user.username,
    name: user.name,
    role: user.role,
    sid,
    iat: Math.floor(now / 1000),
    exp,
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token, env = process.env, now = Date.now()) {
  const secret = env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32 || typeof token !== 'string') return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let received;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.sub || !['ADMIN', 'LEADER'].includes(session.role) || !session.sid || !Number.isFinite(session.exp)) return null;
    if (session.exp <= Math.floor(now / 1000)) {
      activeSessions.delete(session.sid);
      return null;
    }
    if (activeSessions.get(session.sid) !== session.exp) return null;
    return { username: session.sub, name: session.name, role: session.role };
  } catch {
    return null;
  }
}

export function revokeSessionToken(token, env = process.env) {
  const secret = env.SESSION_SECRET;
  if (!secret || typeof token !== 'string') return;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return;
  const expected = createHmac('sha256', secret).update(payload).digest();
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.sid) activeSessions.delete(session.sid);
  } catch {
    // An invalid token has no active server-side session to revoke.
  }
}

export function createPasswordHash(password) {
  if (typeof password !== 'string' || password.length < 1 || password.length > 1024) {
    throw new Error('Password harus berisi 1–1024 karakter.');
  }
  const salt = randomBytes(16);
  return scryptAsync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
    .then((derived) => `${HASH_PREFIX}${salt.toString('base64url')}$${derived.toString('base64url')}`);
}

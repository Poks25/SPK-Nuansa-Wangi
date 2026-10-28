import { Router } from 'express';
import { authenticateDatabaseUser, createPasswordHash, createSessionToken, invalidateAllSessions, revokeSessionToken, SESSION_COOKIE_NAME, verifyPasswordHash } from '../services/authService.js';
import { getCookie, requireAuth, requireRole, sessionCookieOptions } from '../middleware/auth.js';

export function createAuthRouter(env = process.env, pool) {
  const router = Router();
  const recoveryAttempts = new Map();

  router.post('/login', async (request, response, next) => {
    try {
      if (!pool) return response.status(503).json({ error: 'AUTH_UNAVAILABLE', message: 'Layanan akun belum siap.' });
      const { username, password } = request.body || {};
      if (typeof username !== 'string' || typeof password !== 'string' || username.length > 254 || password.length > 1024) {
        return response.status(400).json({ error: 'INVALID_INPUT', message: 'Masukkan username dan password yang valid.' });
      }
      const user = await authenticateDatabaseUser(pool, username, password);
      if (!user) {
        return response.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Username atau password tidak sesuai.' });
      }
      response.cookie(SESSION_COOKIE_NAME, createSessionToken(user, env), sessionCookieOptions(env));
      return response.status(200).json({ user });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/forgot-password', async (request, response, next) => {
    try {
      if (!pool || !env.AUTH_RECOVERY_CODE_HASH) return response.status(503).json({ error: 'RECOVERY_UNAVAILABLE', message: 'Pemulihan password belum disiapkan pada server. Hubungi administrator sistem.' });
      const now = Date.now();
      const address = request.ip || request.socket.remoteAddress || 'unknown';
      let attempt = recoveryAttempts.get(address);
      if (!attempt || now - attempt.startedAt > 15 * 60 * 1000) attempt = { startedAt: now, count: 0 };
      if (attempt.count >= 5) return response.status(429).json({ error: 'TOO_MANY_ATTEMPTS', message: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.' });
      attempt.count += 1;
      recoveryAttempts.set(address, attempt);

      const { username, recoveryCode, password } = request.body || {};
      if (typeof username !== 'string' || username.length > 254 || typeof recoveryCode !== 'string' || recoveryCode.length > 256
        || typeof password !== 'string' || password.length < 1 || password.length > 1024) {
        return response.status(400).json({ error: 'INVALID_INPUT', message: 'Isi username, kode pemulihan, dan password baru dengan benar.' });
      }

      // Recovery code is a high-entropy, server-side secret; compare its scrypt hash before changing any account.
      const validCode = await verifyRecoveryCode(recoveryCode, env.AUTH_RECOVERY_CODE_HASH);
      if (!validCode) return response.status(400).json({ error: 'RECOVERY_FAILED', message: 'Username atau kode pemulihan tidak sesuai.' });
      const [rows] = await pool.execute('SELECT id FROM users WHERE LOWER(username) = ? AND role IN (?, ?) AND is_active = 1 LIMIT 1', [username.trim().toLowerCase(), 'ADMIN', 'LEADER']);
      if (!rows.length) return response.status(400).json({ error: 'RECOVERY_FAILED', message: 'Username atau kode pemulihan tidak sesuai.' });
      const passwordHash = await createPasswordHash(password);
      const [result] = await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, rows[0].id]);
      if (!result.affectedRows) return response.status(400).json({ error: 'RECOVERY_FAILED', message: 'Username atau kode pemulihan tidak sesuai.' });
      invalidateAllSessions();
      recoveryAttempts.delete(address);
      return response.status(200).json({ message: 'Password berhasil diatur ulang. Silakan masuk dengan password baru.' });
    } catch (error) { return next(error); }
  });

  router.post('/logout', (request, response) => {
    revokeSessionToken(getCookie(request, SESSION_COOKIE_NAME), env);
    response.clearCookie(SESSION_COOKIE_NAME, { ...sessionCookieOptions(env), maxAge: undefined });
    response.status(200).json({ message: 'Anda telah keluar.' });
  });

  router.get('/me', (request, response, next) => requireAuth(request, response, next, env), (request, response) => {
    response.status(200).json({ user: request.user });
  });

  const requireAdmin = (request, response, next) => requireAuth(request, response, () => requireRole('ADMIN')(request, response, next), env);
  router.get('/accounts', requireAdmin, async (_request, response, next) => {
    try {
      const [rows] = await pool.query('SELECT username, name, role FROM users WHERE role IN ("ADMIN", "LEADER") AND is_active = 1 ORDER BY role');
      response.json({ data: rows });
    } catch (error) { next(error); }
  });
  router.put('/accounts/:role', requireAdmin, async (request, response, next) => {
    const role = String(request.params.role || '').toUpperCase();
    const { username, password, currentPassword } = request.body || {};
    if (!['ADMIN', 'LEADER'].includes(role) || typeof username !== 'string' || !/^[A-Za-z0-9._-]{3,60}$/.test(username.trim())
      || (password != null && password !== '' && (typeof password !== 'string' || password.length < 1 || password.length > 1024))) {
      return response.status(400).json({ error: 'INVALID_INPUT', message: 'Username harus 3–60 karakter (huruf, angka, titik, garis bawah, atau tanda hubung); password baru tidak boleh kosong.' });
    }
    if (role === 'ADMIN') {
      if (typeof currentPassword !== 'string' || !await authenticateDatabaseUser(pool, request.user.username, currentPassword)) {
        return response.status(401).json({ error: 'CURRENT_PASSWORD_INVALID', message: 'Masukkan password Admin saat ini untuk mengubah akun Admin.' });
      }
    }
    try {
      const [accounts] = await pool.execute('SELECT username FROM users WHERE role = ? AND is_active = 1 LIMIT 1', [role]);
      if (!accounts.length) return response.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Akun tidak ditemukan atau tidak aktif.' });
      const nextUsername = username.trim().toLowerCase();
      if (!password && nextUsername === accounts[0].username.toLowerCase()) return response.status(400).json({ error: 'NO_CHANGES', message: 'Masukkan username atau password baru.' });
      const changes = ['username = ?'];
      const values = [nextUsername];
      if (password) { changes.push('password_hash = ?'); values.push(await createPasswordHash(password)); }
      values.push(role);
      const [result] = await pool.execute('UPDATE users SET ' + changes.join(', ') + ' WHERE role = ? AND is_active = 1', values);
      if (!result.affectedRows) return response.status(404).json({ error: 'ACCOUNT_NOT_FOUND', message: 'Akun tidak ditemukan atau tidak aktif.' });
      invalidateAllSessions();
      response.clearCookie(SESSION_COOKIE_NAME, { ...sessionCookieOptions(env), maxAge: undefined });
      response.json({ message: 'Akun berhasil diperbarui. Silakan masuk kembali dengan username dan password baru.' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'USERNAME_USED', message: 'Username sudah digunakan.' });
      next(error);
    }
  });

  return router;
}

async function verifyRecoveryCode(code, hash) {
  if (typeof hash !== 'string' || !hash.startsWith('scrypt$')) return false;
  return verifyPasswordHash(code, hash);
}

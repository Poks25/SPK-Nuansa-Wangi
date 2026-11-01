// Pakai: npm run auth:reset -- <username> <passwordBaru> [ADMIN|LEADER]
import 'dotenv/config';
import { createDatabasePool } from '../src/config/database.js';
import { createPasswordHash } from '../src/services/authService.js';

const [username, password, roleArg] = process.argv.slice(2);
const role = (roleArg || 'ADMIN').toUpperCase();
if (!username || !password || !['ADMIN', 'LEADER', 'STAFF'].includes(role)) {
  console.error('Pakai: npm run auth:reset -- <username> <passwordBaru> [ADMIN|LEADER]');
  process.exit(1);
}
const pool = createDatabasePool(process.env);
try {
  const hash = await createPasswordHash(password);
  const [rows] = await pool.execute('SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1', [username.trim().toLowerCase()]);
  if (rows.length) {
    await pool.execute('UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?', [hash, rows[0].id]);
    console.log(`Password akun "${username}" diperbarui.`);
  } else {
    const name = role === 'ADMIN' ? 'Administrator Nuansa Wangi' : (role === 'LEADER' ? 'Pimpinan Toko Nuansa Wangi' : 'Staff Toko Nuansa Wangi');
    await pool.execute('INSERT INTO users (username, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, 1)', [username.trim(), hash, name, role]);
    console.log(`Akun baru "${username}" (${role}) dibuat.`);
  }
  const [all] = await pool.query('SELECT username, role, is_active FROM users');
  console.table(all);
} catch (e) {
  console.error('Gagal:', e.code || e.message);
  process.exitCode = 1;
} finally { await pool.end(); }


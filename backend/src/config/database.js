import fs from 'node:fs';
import mysql from 'mysql2/promise';

function buildSsl(env) {
  if (env.DB_SSL !== 'true') return undefined;
  const ssl = { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
  if (env.DB_SSL_CA_FILE) ssl.ca = fs.readFileSync(env.DB_SSL_CA_FILE, 'utf8');
  else if (env.DB_SSL_CA) ssl.ca = env.DB_SSL_CA.replace(/\\n/g, '\n');
  return ssl;
}

/** Pool koneksi MySQL (Laragon lokal atau MySQL cloud). Koneksi diuji saat request, bukan saat import. */
export function createDatabasePool(env = process.env) {
  return mysql.createPool({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME || 'SPKNuansaWangi',
    user: env.DB_USER || 'spk_app',
    password: env.DB_PASSWORD || '',
    ssl: buildSsl(env),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

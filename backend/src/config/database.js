import mysql from 'mysql2/promise';

/** Pool koneksi MySQL XAMPP. Koneksi diuji saat request, bukan saat import. */
export function createDatabasePool(env = process.env) {
  return mysql.createPool({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    database: env.DB_NAME || 'SPKNuansaWangi',
    user: env.DB_USER || 'spk_app',
    password: env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

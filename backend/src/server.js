import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createAuthRouter } from './routes/authRoutes.js';
import { createDatabasePool } from './config/database.js';
import { createMasterDataRouter } from './routes/masterDataRoutes.js';
import { createBusinessRouter } from './routes/businessRoutes.js';

export function createApp(env = process.env, pool = createDatabasePool(env)) {
  const app = express();
  const allowedOrigins = (env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (env.ALLOW_VERCEL_PREVIEWS === 'true' && /^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '20kb' }));

  // Health harus publik dan dideklarasikan sebelum middleware role pada /api.
  app.get('/api/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      service: 'spk-nuansa-wangi-api',
      phase: 3,
      timestamp: new Date().toISOString(),
      database: 'configured',
    });
  });

  app.use('/api/auth', createAuthRouter(env, pool));
  app.use('/api', createBusinessRouter(pool, env));
  app.use('/api', createMasterDataRouter(pool, env));

  app.get('/', (_request, response) => {
    response.status(200).json({
      name: 'SPK Nuansa Wangi Best Seller API',
      message: 'API aktif. Gunakan /api/health untuk pemeriksaan kesehatan.',
      phase: 3,
    });
  });

  app.use((_request, response) => {
    response.status(404).json({
      error: 'ENDPOINT_NOT_FOUND',
      message: 'Endpoint tidak ditemukan.',
    });
  });

  app.use((error, _request, response, _next) => {
    // Jangan kirim kredensial, stack trace, atau detail internal ke client.
    console.error('API request failed');
    response.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan pada API.',
    });
  });

  return app;
}

const app = createApp();
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3002);
  app.listen(port, () => {
    console.log('SPK Nuansa Wangi API listening at http://localhost:' + port);
    console.log('Health endpoint: http://localhost:' + port + '/api/health');
  });
}

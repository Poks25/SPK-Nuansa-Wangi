import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';

const definitions = {
  items: {
    table: 'items', columns: ['code', 'name', 'category', 'unit', 'current_stock', 'minimum_stock', 'is_active', 'notes'],
    required: ['code', 'name', 'category', 'unit'], numeric: ['current_stock', 'minimum_stock'],
  },
  criteria: {
    table: 'criteria', columns: ['code', 'name', 'description', 'criterion_type', 'is_active', 'display_order'],
    required: ['code', 'name', 'criterion_type'],
  },
  subcriteria: {
    table: 'subcriteria', columns: ['criterion_id', 'label', 'score', 'description'],
    required: ['criterion_id', 'label', 'score'], numeric: ['criterion_id', 'score'],
  },
};

function validPayload(body, definition) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (definition.required.some((key) => body[key] === undefined || body[key] === null || String(body[key]).trim() === '')) return false;
  if (definition.numeric?.some((key) => body[key] !== undefined && body[key] !== null && (!Number.isFinite(Number(body[key])) || Number(body[key]) < 0))) return false;
  if ('is_active' in body && typeof body.is_active !== 'boolean' && ![0, 1, '0', '1'].includes(body.is_active)) return false;
  if ('criterion_type' in body && !['BENEFIT', 'COST'].includes(body.criterion_type)) return false;
  if (body.code && (typeof body.code !== 'string' || body.code.trim().length > 40)) return false;
  if (body.name && (typeof body.name !== 'string' || body.name.trim().length > 160)) return false;
  return true;
}

function dbError(error, response) {
  if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'DUPLICATE', message: 'Kode atau label tersebut sudah digunakan.' });
  if (['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2'].includes(error.code)) return response.status(409).json({ error: 'RELATION_CONFLICT', message: 'Data terkait tidak ditemukan atau masih digunakan.' });
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_BAD_DB_ERROR') return response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database belum siap. Periksa konfigurasi MySQL XAMPP.' });
  throw error;
}

export function createMasterDataRouter(pool, env = process.env) {
  const router = Router();
  router.use((request, response, next) => requireAuth(request, response, next, env));

  for (const [resource, definition] of Object.entries(definitions)) {
    const orderBy = resource === 'criteria' ? 'display_order, code' : 'id DESC';
    router.get(`/${resource}`, ...(resource === 'items' ? [] : [requireRole('ADMIN')]), async (_request, response, next) => {
      try {
        const [rows] = await pool.query(`SELECT * FROM ${definition.table} ORDER BY ${orderBy}`);
        response.json({ data: rows });
      } catch (error) { try { dbError(error, response); } catch (raised) { next(raised); } }
    });
    router.post(`/${resource}`, requireRole('ADMIN'), async (request, response, next) => {
      try {
        if (!validPayload(request.body, definition)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'Periksa kembali kolom wajib dan nilai numerik.' });
        const values = definition.columns.map((key) => request.body[key] ?? null);
        const marks = definition.columns.map(() => '?').join(', ');
        const [result] = await pool.execute(`INSERT INTO ${definition.table} (${definition.columns.join(', ')}) VALUES (${marks})`, values);
        const [rows] = await pool.execute(`SELECT * FROM ${definition.table} WHERE id = ?`, [result.insertId]);
        response.status(201).json({ data: rows[0] });
      } catch (error) { try { dbError(error, response); } catch (raised) { next(raised); } }
    });
    router.put(`/${resource}/:id`, requireRole('ADMIN'), async (request, response, next) => {
      try {
        if (!/^\d+$/.test(request.params.id) || !validPayload(request.body, definition)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'ID atau data yang dikirim tidak valid.' });
        const assignments = definition.columns.map((key) => `${key} = ?`).join(', ');
        const values = [...definition.columns.map((key) => request.body[key] ?? null), request.params.id];
        const [result] = await pool.execute(`UPDATE ${definition.table} SET ${assignments} WHERE id = ?`, values);
        if (!result.affectedRows) return response.status(404).json({ error: 'NOT_FOUND', message: 'Data tidak ditemukan.' });
        const [rows] = await pool.execute(`SELECT * FROM ${definition.table} WHERE id = ?`, [request.params.id]);
        response.json({ data: rows[0] });
      } catch (error) { try { dbError(error, response); } catch (raised) { next(raised); } }
    });
    router.delete(`/${resource}/:id`, requireRole('ADMIN'), async (request, response, next) => {
      try {
        if (!/^\d+$/.test(request.params.id)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'ID tidak valid.' });
        const [result] = await pool.execute(`DELETE FROM ${definition.table} WHERE id = ?`, [request.params.id]);
        if (!result.affectedRows) return response.status(404).json({ error: 'NOT_FOUND', message: 'Data tidak ditemukan.' });
        response.status(204).end();
      } catch (error) { try { dbError(error, response); } catch (raised) { next(raised); } }
    });
  }

  router.get('/weights', requireRole('ADMIN'), async (_request, response, next) => {
    try {
      const [rows] = await pool.query(`SELECT c.id AS criterion_id, c.code, c.name, c.is_active, w.weight FROM criteria c LEFT JOIN criterion_weights w ON w.criterion_id = c.id ORDER BY c.display_order, c.code`);
      const activeRows = rows.filter((row) => row.is_active);
      const total = activeRows.reduce((sum, row) => sum + Number(row.weight || 0), 0);
      response.json({ data: rows, total: Number(total.toFixed(8)), valid: activeRows.length > 0 && activeRows.every((row) => Number(row.weight) > 0) && Math.abs(total - 1) <= 0.0001 });
    } catch (error) { try { dbError(error, response); } catch (raised) { next(raised); } }
  });
  router.put('/weights', requireRole('ADMIN'), async (request, response, next) => {
    const rows = request.body?.weights;
    if (!Array.isArray(rows) || !rows.length || rows.some((row) => !Number.isInteger(Number(row.criterion_id)) || !Number.isFinite(Number(row.weight)) || Number(row.weight) <= 0) || Math.abs(rows.reduce((sum, row) => sum + Number(row.weight), 0) - 1) > 0.0001) {
      return response.status(400).json({ error: 'INVALID_WEIGHTS', message: 'Bobot harus bernilai positif dan totalnya tepat 1 (100%).' });
    }
    const ids = rows.map((row) => Number(row.criterion_id));
    if (new Set(ids).size !== ids.length) return response.status(400).json({ error: 'INVALID_WEIGHTS', message: 'Kriteria bobot tidak boleh berulang.' });
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [active] = await connection.query('SELECT id FROM criteria WHERE is_active = TRUE ORDER BY id');
      if (active.length !== ids.length || active.some((row) => !ids.includes(Number(row.id)))) {
        await connection.rollback();
        return response.status(400).json({ error: 'CRITERIA_MISMATCH', message: 'Bobot harus diisi untuk semua kriteria aktif.' });
      }
      for (const row of rows) await connection.execute('INSERT INTO criterion_weights (criterion_id, weight) VALUES (?, ?) ON DUPLICATE KEY UPDATE weight = VALUES(weight)', [Number(row.criterion_id), Number(row.weight)]);
      await connection.commit();
      response.json({ message: 'Bobot berhasil disimpan.', total: Number(rows.reduce((sum, row) => sum + Number(row.weight), 0).toFixed(8)), valid: true });
    } catch (error) {
      if (connection) await connection.rollback();
      try { dbError(error, response); } catch (raised) { next(raised); }
    } finally { connection?.release(); }
  });
  return router;
}

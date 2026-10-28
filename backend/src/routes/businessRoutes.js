import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { calculateSaw } from '../services/sawService.js';

const productColumns = ['code', 'name', 'category', 'volume_ml', 'price', 'current_stock', 'is_active', 'notes'];
function validProduct(body) {
  return body && typeof body === 'object' && !Array.isArray(body)
    && typeof body.code === 'string' && body.code.trim().length > 0 && body.code.trim().length <= 40
    && typeof body.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 160
    && typeof body.category === 'string' && body.category.trim().length > 0 && body.category.trim().length <= 100
    && Number.isInteger(Number(body.volume_ml)) && Number(body.volume_ml) > 0
    && Number.isFinite(Number(body.price)) && Number(body.price) >= 0
    && Number.isInteger(Number(body.current_stock ?? 0)) && Number(body.current_stock ?? 0) >= 0
    && (body.is_active === undefined || typeof body.is_active === 'boolean' || [0, 1, '0', '1'].includes(body.is_active));
}
function dbFailure(error, response, next) {
  if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'DUPLICATE', message: 'Kode atau nomor transaksi sudah digunakan.' });
  if (['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2'].includes(error.code)) return response.status(409).json({ error: 'RELATION_CONFLICT', message: 'Data terkait masih digunakan.' });
  if (['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error.code)) return response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database belum siap. Periksa MySQL XAMPP.' });
  next(error);
}

export function createBusinessRouter(pool, env = process.env) {
  const router = Router();
  router.use((request, response, next) => requireAuth(request, response, next, env));
  router.get('/products', async (_request, response, next) => {
    try {
      const [rows] = await pool.query('SELECT id, ' + productColumns.join(', ') + ' FROM products ORDER BY name, volume_ml');
      response.json({ data: rows });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.post('/products', requireRole('ADMIN'), async (request, response, next) => {
    const submitted = { ...request.body, code: 'AUTO' };
    if (!validProduct(submitted)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'Periksa nama, merek/kategori, ukuran, harga, dan stok produk.' });
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [latest] = await connection.query("SELECT code FROM products WHERE code REGEXP '^NW-[0-9]+$' ORDER BY CAST(SUBSTRING(code, 4) AS UNSIGNED) DESC, id DESC LIMIT 1 FOR UPDATE");
      const lastNumber = Number(String(latest[0]?.code || 'NW-000').slice(3)) || 0;
      const code = 'NW-' + String(lastNumber + 1).padStart(3, '0');
      const product = { ...request.body, code };
      const values = productColumns.map((key) => key === 'is_active' ? (product[key] ?? true) : key === 'notes' ? (product[key] || null) : key === 'current_stock' ? (product[key] ?? 0) : key === 'volume_ml' || key === 'price' ? Number(product[key]) : product[key].trim());
      const [result] = await connection.execute('INSERT INTO products (' + productColumns.join(', ') + ') VALUES (' + productColumns.map(() => '?').join(', ') + ')', values);
      const [rows] = await connection.execute('SELECT id, ' + productColumns.join(', ') + ' FROM products WHERE id = ?', [result.insertId]);
      await connection.commit();
      response.status(201).json({ data: rows[0] });
    } catch (error) {
      if (connection) await connection.rollback();
      dbFailure(error, response, next);
    } finally { connection?.release(); }
  });
  router.put('/products/:id', requireRole('ADMIN'), async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || !validProduct(request.body)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'ID atau data produk tidak valid.' });
      const values = productColumns.map((key) => key === 'is_active' ? (request.body[key] ?? true) : key === 'notes' ? (request.body[key] || null) : key === 'current_stock' ? (request.body[key] ?? 0) : key === 'volume_ml' || key === 'price' ? Number(request.body[key]) : request.body[key].trim());
      const [result] = await pool.execute('UPDATE products SET ' + productColumns.map((key) => key + ' = ?').join(', ') + ' WHERE id = ?', [...values, request.params.id]);
      if (!result.affectedRows) return response.status(404).json({ error: 'NOT_FOUND', message: 'Produk tidak ditemukan.' });
      const [rows] = await pool.execute('SELECT id, ' + productColumns.join(', ') + ' FROM products WHERE id = ?', [request.params.id]);
      response.json({ data: rows[0] });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.delete('/products/:id', requireRole('ADMIN'), async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'ID produk tidak valid.' });
      const [rows] = await pool.execute('SELECT id FROM products WHERE id = ?', [request.params.id]);
      if (!rows.length) return response.status(404).json({ error: 'NOT_FOUND', message: 'Produk tidak ditemukan.' });
      await pool.execute('UPDATE products SET is_active = 0 WHERE id = ?', [request.params.id]);
      response.status(204).end();
    } catch (error) { dbFailure(error, response, next); }
  });
  router.get('/dashboard/summary', requireRole('ADMIN', 'LEADER'), async (request, response, next) => {
    const { from, to } = request.query;
    const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
    if ((from === undefined) !== (to === undefined) || (from !== undefined && (!validDate(from) || !validDate(to) || from > to))) return response.status(400).json({ error: 'INVALID_INPUT', message: 'Pilih tanggal atau bulan yang valid.' });
    try {
      const [[productStats]] = await pool.query('SELECT COUNT(*) AS product_count FROM products WHERE is_active = 1');
      const periodClause = from === undefined ? '' : ' WHERE transaction_date >= ? AND transaction_date <= ?';
      const periodParams = from === undefined ? [] : [from, to];
      const [[salesStats]] = await pool.execute('SELECT COUNT(*) AS transaction_count, COALESCE(SUM(total_amount), 0) AS gross_sales FROM sales_transactions' + periodClause, periodParams);
      const [[unitStats]] = await pool.execute('SELECT COALESCE(SUM(i.quantity), 0) AS sold_units FROM sales_transaction_items i JOIN sales_transactions t ON t.id = i.transaction_id' + (from === undefined ? '' : ' WHERE t.transaction_date >= ? AND t.transaction_date <= ?'), periodParams);
      const [[criteriaStats]] = await pool.query('SELECT COUNT(*) AS active_count, SUM(w.weight IS NOT NULL AND w.weight > 0) AS weighted_count, COALESCE(SUM(w.weight), 0) AS total_weight FROM criteria c LEFT JOIN criterion_weights w ON w.criterion_id = c.id WHERE c.is_active = 1');
      const evaluationFilter = from === undefined ? '' : ' AND period_start <= ? AND period_end >= ?';
      const evaluationParams = from === undefined ? [] : [to, from];
      const [evaluations] = await pool.execute('SELECT id, title, DATE_FORMAT(period_start, "%Y-%m-%d") AS period_start, DATE_FORMAT(period_end, "%Y-%m-%d") AS period_end FROM saw_evaluations WHERE status = "FINAL"' + evaluationFilter + ' ORDER BY created_at DESC, id DESC LIMIT 1', evaluationParams);
      let ranking = [];
      if (evaluations.length) {
        const [rows] = await pool.execute('SELECT p.id, p.code, p.name, p.category, p.volume_ml, r.rank_position, r.final_score FROM saw_results r JOIN products p ON p.id = r.product_id WHERE r.evaluation_id = ? ORDER BY r.rank_position LIMIT 5', [evaluations[0].id]);
        ranking = rows;
      }
      const activeCount = Number(criteriaStats.active_count || 0);
      const weightedCount = Number(criteriaStats.weighted_count || 0);
      const weightTotal = Number(criteriaStats.total_weight || 0);
      response.json({ products: Number(productStats.product_count), transactions: Number(salesStats.transaction_count), unitsSold: Number(unitStats.sold_units), grossSales: Number(salesStats.gross_sales), period: from === undefined ? null : { from, to }, criteria: { active: activeCount, completeWeights: weightedCount === activeCount && activeCount > 0, weightTotal }, latestEvaluation: evaluations[0] || null, ranking });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.get('/evaluations', requireRole('ADMIN', 'LEADER'), async (_request, response, next) => {
    try {
      const [rows] = await pool.query('SELECT id, title, DATE_FORMAT(period_start, "%Y-%m-%d") AS period_start, DATE_FORMAT(period_end, "%Y-%m-%d") AS period_end, total_products, status, created_at FROM saw_evaluations ORDER BY created_at DESC, id DESC');
      response.json({ data: rows });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.get('/evaluations/periods', requireRole('ADMIN', 'LEADER'), async (_request, response, next) => {
    try {
      const [[range]] = await pool.query('SELECT COUNT(*) AS transaction_count, DATE_FORMAT(MIN(transaction_date), "%Y-%m-%d") AS first_date, DATE_FORMAT(MAX(transaction_date), "%Y-%m-%d") AS last_date FROM sales_transactions');
      response.json({ data: { transaction_count: Number(range.transaction_count || 0), first_date: range.first_date, last_date: range.last_date } });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.get('/evaluations/preview', requireRole('ADMIN', 'LEADER'), async (request, response, next) => {
    const periodStart = request.query.period_start;
    const periodEnd = request.query.period_end;
    const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
    if (!validDate(periodStart) || !validDate(periodEnd) || periodStart > periodEnd) return response.status(400).json({ error: 'INVALID_INPUT', message: 'Pilih rentang tanggal yang valid.' });
    try {
      const [criteria] = await pool.query('SELECT c.id, c.code, c.name, c.criterion_type, w.weight FROM criteria c LEFT JOIN criterion_weights w ON w.criterion_id = c.id WHERE c.is_active = 1 ORDER BY c.display_order, c.code');
      if (criteria.length !== 6 || criteria.some((item, index) => item.code !== 'C' + (index + 1) || !Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0) || Math.abs(criteria.reduce((sum, item) => sum + Number(item.weight), 0) - 1) > 0.0001) return response.status(409).json({ error: 'CRITERIA_NOT_READY', message: 'Pratinjau memerlukan enam kriteria C1–C6 aktif dengan bobot lengkap berjumlah 100%.' });
      const [products] = await pool.query('SELECT id, code, name, category, volume_ml FROM products WHERE is_active = 1 ORDER BY name, id');
      if (!products.length) return response.status(409).json({ error: 'NO_PRODUCTS', message: 'Belum ada produk aktif untuk dinilai.' });
      const [transactions] = await pool.execute('SELECT i.product_id, t.id AS transaction_id, i.quantity, i.subtotal, DATE_FORMAT(t.transaction_date, "%Y-%m-%d") AS transaction_date, t.customer_name, t.customer_phone FROM sales_transactions t JOIN sales_transaction_items i ON i.transaction_id = t.id WHERE t.transaction_date >= ? AND t.transaction_date <= ? ORDER BY t.id, i.id', [periodStart, periodEnd]);
      const results = calculateSaw(products, transactions, criteria, periodStart, periodEnd);
      response.json({ data: { period_start: periodStart, period_end: periodEnd, transaction_count: transactions.length, total_products: results.length, criteria, results: results.map((row) => ({ product_id: row.product.id, code: row.product.code, name: row.product.name, category: row.product.category, volume_ml: row.product.volume_ml, rank_position: row.rank, raw: row.raw, normalized: row.norm, contributions: row.norm.map((value, index) => Number((value * Number(criteria[index].weight)).toFixed(6))), final_score: row.finalScore })) } });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.post('/evaluations', requireRole('ADMIN'), async (request, response, next) => {
    const { title, period_start: periodStart, period_end: periodEnd } = request.body || {};
    const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 || !validDate(periodStart) || !validDate(periodEnd) || periodStart > periodEnd) {
      return response.status(400).json({ error: 'INVALID_INPUT', message: 'Judul dan rentang tanggal perhitungan harus valid.' });
    }
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [criteria] = await connection.query('SELECT c.id, c.code, c.name, c.criterion_type, w.weight FROM criteria c LEFT JOIN criterion_weights w ON w.criterion_id = c.id WHERE c.is_active = 1 ORDER BY c.display_order, c.code FOR UPDATE');
      if (criteria.length !== 6 || criteria.some((item, index) => item.code !== 'C' + (index + 1) || !Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0) || Math.abs(criteria.reduce((sum, item) => sum + Number(item.weight), 0) - 1) > 0.0001) {
        await connection.rollback();
        return response.status(409).json({ error: 'CRITERIA_NOT_READY', message: 'Perhitungan memerlukan enam kriteria C1–C6 aktif dengan bobot lengkap berjumlah 100%.' });
      }
      const [products] = await connection.query('SELECT id, code, name, category, volume_ml FROM products WHERE is_active = 1 ORDER BY name, id');
      if (!products.length) { await connection.rollback(); return response.status(409).json({ error: 'NO_PRODUCTS', message: 'Belum ada produk aktif untuk dihitung.' }); }
      const [transactions] = await connection.execute('SELECT i.product_id, t.id AS transaction_id, i.quantity, i.subtotal, DATE_FORMAT(t.transaction_date, "%Y-%m-%d") AS transaction_date, t.customer_name, t.customer_phone FROM sales_transactions t JOIN sales_transaction_items i ON i.transaction_id = t.id WHERE t.transaction_date >= ? AND t.transaction_date <= ? ORDER BY t.id, i.id', [periodStart, periodEnd]);
      const results = calculateSaw(products, transactions, criteria, periodStart, periodEnd);
      const [evaluation] = await connection.execute('INSERT INTO saw_evaluations (title, period_start, period_end, total_products, status, created_by) VALUES (?, ?, ?, ?, "FINAL", ?)', [title.trim(), periodStart, periodEnd, results.length, request.user.username || request.user.sub || 'admin']);
      for (const row of results) {
        const raw = row.raw.map((value) => value.toFixed(4));
        const norm = row.norm.map((value) => value.toFixed(6));
        const columns = Array.from({ length: 6 }, (_, i) => `raw_c${i + 1}`).concat(Array.from({ length: 6 }, (_, i) => `norm_c${i + 1}`));
        await connection.execute('INSERT INTO saw_results (evaluation_id, product_id, rank_position, ' + columns.join(', ') + ', final_score) VALUES (' + Array.from({ length: 16 }, () => '?').join(', ') + ')', [evaluation.insertId, row.product.id, row.rank, ...raw, ...norm, row.finalScore.toFixed(6)]);
      }
      await connection.commit();
      response.status(201).json({ data: { id: evaluation.insertId, title: title.trim(), period_start: periodStart, period_end: periodEnd, total_products: results.length, status: 'FINAL', criteria, results: results.map((row) => ({ product_id: row.product.id, name: row.product.name, rank_position: row.rank, final_score: row.finalScore })) } });
    } catch (error) {
      if (connection) await connection.rollback();
      dbFailure(error, response, next);
    } finally { connection?.release(); }
  });
  router.get('/evaluations/:id/results', requireRole('ADMIN', 'LEADER'), async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id)) return response.status(400).json({ error: 'INVALID_INPUT', message: 'ID perhitungan tidak valid.' });
      const [evaluations] = await pool.execute('SELECT id, title, DATE_FORMAT(period_start, "%Y-%m-%d") AS period_start, DATE_FORMAT(period_end, "%Y-%m-%d") AS period_end, total_products, status, created_at FROM saw_evaluations WHERE id = ?', [request.params.id]);
      if (!evaluations.length) return response.status(404).json({ error: 'NOT_FOUND', message: 'Perhitungan tidak ditemukan.' });
      const [criteria] = await pool.query('SELECT c.code, c.name, c.criterion_type, w.weight FROM criteria c LEFT JOIN criterion_weights w ON w.criterion_id = c.id ORDER BY c.display_order, c.code');
      const fields = Array.from({ length: 6 }, (_, i) => 'r.raw_c' + (i + 1) + ', r.norm_c' + (i + 1)).join(', ');
      const [rows] = await pool.execute('SELECT r.rank_position, p.id AS product_id, p.code, p.name, p.category, p.volume_ml, ' + fields + ', r.final_score FROM saw_results r JOIN products p ON p.id = r.product_id WHERE r.evaluation_id = ? ORDER BY r.rank_position, p.name', [request.params.id]);
      response.json({ evaluation: evaluations[0], criteria, data: rows });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.get('/transactions', requireRole('ADMIN'), async (request, response, next) => {
    try {
      const clauses = [];
      const values = [];
      if (request.query.from && /^\d{4}-\d{2}-\d{2}$/.test(request.query.from)) { clauses.push('t.transaction_date >= ?'); values.push(request.query.from); }
      if (request.query.to && /^\d{4}-\d{2}-\d{2}$/.test(request.query.to)) { clauses.push('t.transaction_date <= ?'); values.push(request.query.to); }
      const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
      const [rows] = await pool.execute('SELECT t.id, t.invoice_number, t.transaction_date, t.total_amount, COUNT(i.id) AS line_count, COALESCE(SUM(i.quantity), 0) AS unit_count FROM sales_transactions t LEFT JOIN sales_transaction_items i ON i.transaction_id = t.id ' + where + ' GROUP BY t.id ORDER BY t.transaction_date DESC, t.id DESC LIMIT 250', values);
      response.json({ data: rows });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.get('/reports/sales', requireRole('ADMIN', 'LEADER'), async (request, response, next) => {
    const { from, to } = request.query;
    const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
    if ((from === undefined) !== (to === undefined) || (from !== undefined && (!validDate(from) || !validDate(to) || from > to))) return response.status(400).json({ error: 'INVALID_INPUT', message: 'Pilih rentang tanggal laporan yang valid.' });
    try {
      const transactionWhere = from === undefined ? '' : ' WHERE t.transaction_date >= ? AND t.transaction_date <= ?';
      const params = from === undefined ? [] : [from, to];
      const [[summary]] = await pool.execute('SELECT COUNT(*) AS transaction_count, COALESCE(SUM(t.total_amount), 0) AS gross_sales, COALESCE(AVG(t.total_amount), 0) AS average_transaction FROM sales_transactions t' + transactionWhere, params);
      const [[unitSummary]] = await pool.execute('SELECT COALESCE(SUM(i.quantity), 0) AS units_sold FROM sales_transaction_items i JOIN sales_transactions t ON t.id = i.transaction_id' + transactionWhere, params);
      const subqueryWhere = from === undefined ? '' : ' WHERE t.transaction_date >= ? AND t.transaction_date <= ?';
      const [products] = await pool.execute(
        'SELECT p.id, p.code, p.name, p.category, p.volume_ml, p.current_stock, COALESCE(s.units_sold, 0) AS units_sold, COALESCE(s.transaction_count, 0) AS transaction_count, COALESCE(s.gross_sales, 0) AS gross_sales FROM products p LEFT JOIN (SELECT i.product_id, SUM(i.quantity) AS units_sold, COUNT(DISTINCT t.id) AS transaction_count, SUM(i.subtotal) AS gross_sales FROM sales_transaction_items i JOIN sales_transactions t ON t.id = i.transaction_id' + subqueryWhere + ' GROUP BY i.product_id) s ON s.product_id = p.id ORDER BY gross_sales DESC, units_sold DESC, p.name', params);
      const [transactions] = await pool.execute(
        'SELECT t.id, t.invoice_number, DATE_FORMAT(t.transaction_date, "%Y-%m-%d") AS transaction_date, t.customer_name, t.notes, t.total_amount, COUNT(i.id) AS line_count, COALESCE(SUM(i.quantity), 0) AS unit_count FROM sales_transactions t LEFT JOIN sales_transaction_items i ON i.transaction_id = t.id' + transactionWhere + ' GROUP BY t.id ORDER BY t.transaction_date DESC, t.id DESC LIMIT 250', params);
      const [monthly] = await pool.execute('SELECT DATE_FORMAT(t.transaction_date, "%Y-%m") AS month, COUNT(*) AS transaction_count, COALESCE(SUM(t.total_amount), 0) AS gross_sales FROM sales_transactions t' + transactionWhere + ' GROUP BY YEAR(t.transaction_date), MONTH(t.transaction_date) ORDER BY YEAR(t.transaction_date), MONTH(t.transaction_date)', params);
      response.json({ data: { period: from === undefined ? null : { from, to }, summary: { transaction_count: Number(summary.transaction_count), units_sold: Number(unitSummary.units_sold), gross_sales: Number(summary.gross_sales), average_transaction: Number(summary.average_transaction) }, products, transactions, monthly } });
    } catch (error) { dbFailure(error, response, next); }
  });
  router.post('/transactions', requireRole('ADMIN'), async (request, response, next) => {
    const { transaction_date: date, items, notes, customer_name: customerName, customer_phone: customerPhone } = request.body || {};
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(items) || !items.length || items.length > 50
      || items.some((item) => !Number.isInteger(Number(item.product_id)) || Number(item.product_id) <= 0 || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0)
      || new Set(items.map((item) => Number(item.product_id))).size !== items.length
      || (notes != null && (typeof notes !== 'string' || notes.length > 2000))
      || (customerName != null && (typeof customerName !== 'string' || customerName.trim().length > 120))
      || (customerPhone != null && (typeof customerPhone !== 'string' || customerPhone.trim().length > 40))) {
      return response.status(400).json({ error: 'INVALID_INPUT', message: 'Tanggal dan rincian transaksi harus valid; produk tidak boleh berulang.' });
    }
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const ids = items.map((item) => Number(item.product_id));
      const [products] = await connection.query('SELECT id, price FROM products WHERE is_active = 1 AND id IN (' + ids.map(() => '?').join(',') + ') FOR UPDATE', ids);
      if (products.length !== ids.length) { await connection.rollback(); return response.status(400).json({ error: 'PRODUCT_UNAVAILABLE', message: 'Satu atau lebih produk tidak aktif atau tidak ditemukan.' }); }
      const priceById = new Map(products.map((product) => [Number(product.id), Math.round(Number(product.price) * 100)]));
      const lineItems = items.map((item) => {
        const priceCents = priceById.get(Number(item.product_id));
        const subtotalCents = priceCents * Number(item.quantity);
        if (!Number.isSafeInteger(subtotalCents)) throw Object.assign(new Error('Amount out of range'), { code: 'INVALID_AMOUNT' });
        return { productId: Number(item.product_id), quantity: Number(item.quantity), price: (priceCents / 100).toFixed(2), subtotal: (subtotalCents / 100).toFixed(2), cents: subtotalCents };
      });
      const total = (lineItems.reduce((sum, item) => sum + item.cents, 0) / 100).toFixed(2);
      const invoice = 'NW-' + date.replaceAll('-', '') + '-' + randomBytes(4).toString('hex').toUpperCase();
      const [header] = await connection.execute('INSERT INTO sales_transactions (invoice_number, transaction_date, customer_name, customer_phone, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?)', [invoice, date, customerName?.trim() || 'Pelanggan Umum', customerPhone?.trim() || null, total, notes?.trim() || null]);
      for (const item of lineItems) await connection.execute('INSERT INTO sales_transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)', [header.insertId, item.productId, item.quantity, item.price, item.subtotal]);
      await connection.commit();
      response.status(201).json({ data: { id: header.insertId, invoice_number: invoice, transaction_date: date, total_amount: total, line_count: lineItems.length, unit_count: lineItems.reduce((sum, item) => sum + item.quantity, 0) } });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === 'INVALID_AMOUNT') return response.status(400).json({ error: 'INVALID_AMOUNT', message: 'Nilai total transaksi melebihi batas.' });
      dbFailure(error, response, next);
    } finally { connection?.release(); }
  });
  return router;
}

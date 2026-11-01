import 'dotenv/config';
import { createDatabasePool } from '../src/config/database.js';

// Fictional demonstration baskets only. This script is append-only and refuses
// to run if any invoices with its DEMO-NW-2025 prefix already exist.
const entries = [
  ['2025-01-08', '01', 'Paket keluarga', [[1,2],[3,2],[5,2]]],
  ['2025-01-23', '02', 'Belanja koleksi bulanan', [[2,3],[7,2],[8,1]]],
  ['2025-02-07', '03', 'Paket hadiah keluarga', [[9,2],[4,2],[6,2]]],
  ['2025-02-19', '01', 'Isi ulang koleksi rumah', [[1,2],[2,2],[5,2],[6,2]]],
  ['2025-03-05', '04', 'Belanja koleksi bulanan', [[3,3],[4,2],[8,2]]],
  ['2025-03-22', '02', 'Paket hadiah keluarga', [[2,2],[6,2],[9,2]]],
  ['2025-04-09', '05', 'Paket keluarga', [[1,2],[4,2],[7,2]]],
  ['2025-04-24', '03', 'Belanja koleksi bulanan', [[3,2],[5,2],[6,2],[8,2]]],
  ['2025-05-06', '06', 'Paket hadiah keluarga', [[2,3],[4,2],[8,2]]],
  ['2025-05-21', '01', 'Isi ulang koleksi rumah', [[1,3],[3,2],[5,2],[7,2]]],
  ['2025-06-04', '07', 'Paket keluarga', [[2,2],[5,2],[6,2],[1,1]]],
  ['2025-06-18', '03', 'Belanja koleksi bulanan', [[3,2],[4,2],[8,2],[9,2]]],
  ['2025-07-07', '02', 'Paket hadiah keluarga', [[1,2],[2,2],[7,2],[9,2]]],
  ['2025-07-25', '05', 'Isi ulang koleksi rumah', [[3,2],[5,2],[6,2],[8,2]]],
  ['2025-08-03', '08', 'Paket keluarga', [[2,2],[4,2],[6,2],[7,2]]],
  ['2025-08-20', '01', 'Belanja koleksi bulanan', [[1,3],[3,2],[5,2],[9,2]]],
  ['2025-09-08', '04', 'Paket hadiah keluarga', [[1,2],[2,2],[3,2],[4,2]]],
  ['2025-09-23', '03', 'Isi ulang koleksi rumah', [[5,2],[6,2],[7,2],[8,2],[9,2]]],
  ['2025-10-05', '06', 'Paket keluarga', [[1,2],[4,2],[8,2],[6,1]]],
  ['2025-10-26', '02', 'Paket hadiah acara kantor', [[1,10],[7,10]]],
  ['2025-11-09', '07', 'Belanja koleksi bulanan', [[1,2],[2,2],[3,2],[4,2],[5,2]]],
  ['2025-11-24', '05', 'Paket hadiah keluarga', [[6,2],[7,2],[8,2],[9,2]]],
  ['2025-12-07', '08', 'Isi ulang koleksi rumah', [[1,2],[3,2],[5,2],[7,2],[9,2]]],
  ['2025-12-20', '01', 'Pesanan suvenir acara perusahaan', [[1,15],[5,15],[9,15]]],
];

const pool = createDatabasePool();
let connection;
try {
  connection = await pool.getConnection();
  await connection.beginTransaction();
  const [existing] = await connection.query("SELECT COUNT(*) AS count FROM sales_transactions WHERE invoice_number LIKE 'DEMO-NW-2025-%'");
  if (Number(existing[0].count) > 0) throw new Error('Transaksi DEMO 2025 sudah ada; proses dihentikan agar tidak menggandakan data.');

  const productIds = [...new Set(entries.flatMap(([, , , lines]) => lines.map(([id]) => id)))];
  const [products] = await connection.execute('SELECT id, price FROM products WHERE is_active = 1 AND id IN (' + productIds.map(() => '?').join(',') + ')', productIds);
  if (products.length !== productIds.length) throw new Error('Katalog produk aktif tidak cocok dengan daftar data demo; tidak ada transaksi yang ditambahkan.');
  const prices = new Map(products.map((product) => [Number(product.id), Math.round(Number(product.price) * 100)]));

  let lineCount = 0;
  let totalCents = 0;
  const transactionIds = [];
  for (let index = 0; index < entries.length; index += 1) {
    const [date, customerCode, occasion, lines] = entries[index];
    const invoice = `DEMO-NW-${date.replaceAll('-', '')}-${String(index + 1).padStart(3, '0')}`;
    const pricedLines = lines.map(([productId, quantity]) => {
      const cents = prices.get(productId) * quantity;
      return { productId, quantity, unitPrice: (prices.get(productId) / 100).toFixed(2), subtotal: (cents / 100).toFixed(2), cents };
    });
    const transactionCents = pricedLines.reduce((sum, item) => sum + item.cents, 0);
    if (transactionCents < 50000_000 || transactionCents > 1_000_000_000) throw new Error(`Nilai transaksi ${invoice} di luar rentang demo Rp500.000–Rp10.000.000.`);
    const customer = 'Pelanggan Demo ' + customerCode;
    const note = `DEMO: Data sintetis untuk demonstrasi, bukan transaksi aktual. Konteks belanja: ${occasion}.`;
    const [header] = await connection.execute('INSERT INTO sales_transactions (invoice_number, transaction_date, customer_name, customer_phone, total_amount, notes) VALUES (?, ?, ?, NULL, ?, ?)', [invoice, date, customer, (transactionCents / 100).toFixed(2), note]);
    transactionIds.push(header.insertId);
    for (const item of pricedLines) {
      await connection.execute('INSERT INTO sales_transaction_items (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)', [header.insertId, item.productId, item.quantity, item.unitPrice, item.subtotal]);
      lineCount += 1;
    }
    totalCents += transactionCents;
  }
  await connection.commit();
  console.log(JSON.stringify({ created: entries.length, lines: lineCount, firstDate: entries[0][0], lastDate: entries.at(-1)[0], minimumBasket: '500000.00', maximumBasket: '3975000.00', grossSales: (totalCents / 100).toFixed(2), firstId: transactionIds[0], lastId: transactionIds.at(-1) }));
} catch (error) {
  if (connection) await connection.rollback();
  console.error(error.message);
  process.exitCode = 1;
} finally {
  connection?.release();
  await pool.end();
}

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { apiUrl } from './api.js';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function TransactionsPage() {
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: '1' }]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [productResponse, transactionResponse] = await Promise.all([
        fetch(apiUrl('/api/products'), { credentials: 'include' }),
        fetch(apiUrl('/api/transactions'), { credentials: 'include' }),
      ]);
      const [productBody, transactionBody] = await Promise.all([productResponse.json(), transactionResponse.json()]);
      if (!productResponse.ok) throw new Error(productBody.message || 'Produk gagal dimuat.');
      if (!transactionResponse.ok) throw new Error(transactionBody.message || 'Transaksi gagal dimuat.');
      setProducts(productBody.data || []); setRows(transactionBody.data || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const total = items.reduce((sum, line) => {
    const product = products.find((row) => String(row.id) === String(line.product_id));
    return sum + (product ? Number(product.price) * Number(line.quantity || 0) : 0);
  }, 0);
  const updateLine = (index, key, value) => setItems((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch(apiUrl('/api/transactions'), {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_date: date, notes, customer_name: customerName, customer_phone: customerPhone, items: items.map((line) => ({ product_id: Number(line.product_id), quantity: Number(line.quantity) })) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Transaksi gagal disimpan.');
      setShowForm(false); setItems([{ product_id: '', quantity: '1' }]); setNotes(''); setCustomerName(''); setCustomerPhone(''); await load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return <main className="page-content">
    <div className="page-heading"><div><div className="page-kicker"><FileText size={14}/> PENJUALAN <span>/</span> TRANSAKSI</div><h1>Transaksi penjualan</h1><p>Catat penjualan produk. Harga diambil dari katalog dan rincian disimpan bersama nomor transaksi.</p></div><button className="button button--primary" onClick={() => { setError(''); setShowForm(true); }}>+ Transaksi baru</button></div>
    {error && <div className="auth-error" role="alert">{error} <button onClick={load}>Muat ulang</button></div>}
    <section className="panel master-panel">
      <div className="master-toolbar"><span>Riwayat transaksi</span><span>{rows.length} transaksi</span></div>
      {loading ? <div className="master-empty">Memuat transaksi…</div> : rows.length === 0 ? <div className="master-empty"><strong>Belum ada transaksi.</strong><span>Transaksi yang dicatat akan tampil di sini.</span></div> : <div className="table-wrap"><table className="ranking-table"><thead><tr><th>NOMOR</th><th>TANGGAL</th><th>BARIS PRODUK</th><th>UNIT</th><th>TOTAL</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.invoice_number}</td><td>{new Date(String(row.transaction_date).slice(0,10) + 'T00:00:00').toLocaleDateString('id-ID')}</td><td>{row.line_count}</td><td>{row.unit_count}</td><td>{money.format(Number(row.total_amount))}</td></tr>)}</tbody></table></div>}
    </section>
    {showForm && <div className="master-modal-backdrop"><section className="panel master-modal"><div className="panel-heading"><div><div className="eyebrow">FORM PENJUALAN</div><h2>Transaksi baru</h2></div><button className="button button--subtle" onClick={() => setShowForm(false)}>Tutup</button></div>
      {products.filter((product) => Boolean(product.is_active)).length === 0 ? <div className="master-empty">Aktifkan produk terlebih dahulu.</div> : <form className="master-form" onSubmit={submit}>
        <label className="form-label">Tanggal transaksi<input type="date" required value={date} onChange={(e) => setDate(e.target.value)}/></label>
        <label className="form-label">Nama pelanggan (opsional)<input maxLength={120} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Kosongkan untuk Pelanggan Umum"/></label>
        <label className="form-label">Nomor telepon (opsional)<input type="tel" maxLength={40} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Untuk menghitung pembelian ulang"/></label>
        {items.map((line, index) => <div className="transaction-line" key={index}><label className="form-label">Produk<select required value={line.product_id} onChange={(e) => updateLine(index, 'product_id', e.target.value)}><option value="">Pilih produk</option>{products.filter((product) => Boolean(product.is_active)).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.volume_ml} ml · {money.format(Number(product.price))}</option>)}</select></label><label className="form-label">Jumlah<input type="number" min="1" step="1" required value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)}/></label>{items.length > 1 && <button type="button" className="button button--subtle" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>Hapus</button>}</div>)}
        <button className="button button--outline button--sm" type="button" onClick={() => setItems((current) => [...current, { product_id: '', quantity: '1' }])}>+ Tambah produk</button>
        <label className="form-label">Catatan (opsional)<textarea maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}/></label>
        <div className="weight-status"><strong>Total transaksi</strong><span>{money.format(total)}</span><small>Harga unit mengikuti katalog saat transaksi dicatat.</small></div>
        {error && <div className="auth-error" role="alert">{error}</div>}<button className="button button--primary" disabled={saving || items.some((line) => !line.product_id || Number(line.quantity) < 1)} type="submit">{saving ? 'Menyimpan…' : 'Simpan transaksi'}</button>
      </form>}
    </section></div>}
  </main>;
}

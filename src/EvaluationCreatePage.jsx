import { useState } from 'react';
import { Activity, ArrowRight, CalendarDays } from 'lucide-react';
import { apiUrl } from './api.js';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const monthStart = () => today().slice(0, 8) + '01';

export default function EvaluationCreatePage() {
  const [title, setTitle] = useState('Perhitungan SAW ' + today().slice(0, 7));
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setResult(null);
    try {
      const response = await fetch(apiUrl('/api/evaluations'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, period_start: start, period_end: end }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Perhitungan SAW gagal.');
      setResult(body.data);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  return <main className="page-content">
    <div className="page-heading"><div><div className="page-kicker"><Activity size={14}/> ANALISIS <span>/</span> PERHITUNGAN SAW</div><h1>Perhitungan SAW</h1><p>Hitung ulang produk aktif berdasarkan transaksi pada rentang tanggal yang dipilih.</p></div></div>
    <div className="demo-notice"><div className="demo-notice__icon"><CalendarDays size={17}/></div><div><strong>Aturan perhitungan C5 dan C6</strong><p>C5 menghitung pelanggan yang membeli produk minimal dua transaksi. C6 menghitung jumlah bulan dengan penjualan dibagi jumlah bulan dalam rentang tanggal. Identitas pelanggan memakai nomor telepon; jika kosong, nama selain “Pelanggan Umum”.</p></div></div>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <section className="panel master-panel"><div className="panel-heading"><div><div className="eyebrow">PERIODE ANALISIS</div><h2>Buat snapshot peringkat baru</h2><p>Hasil baru disimpan sebagai perhitungan FINAL dan tidak mengubah transaksi maupun stok.</p></div></div>
      <form className="master-form evaluation-create-form" onSubmit={submit}>
        <label className="form-label evaluation-title-field">Nama perhitungan<input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)}/></label>
        <label className="form-label">Mulai periode<input type="date" required value={start} max={end} onChange={(e) => setStart(e.target.value)}/></label>
        <label className="form-label">Akhir periode<input type="date" required value={end} min={start} onChange={(e) => setEnd(e.target.value)}/></label>
        <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Menghitung…' : 'Hitung dan simpan hasil'} <ArrowRight size={15}/></button>
      </form>
    </section>
    {result && <section className="panel evaluation-summary evaluation-created"><div><span>Status</span><strong>{result.status}</strong></div><div><span>Produk dihitung</span><strong>{result.total_products}</strong></div><div><span>Periode</span><strong>{result.period_start} – {result.period_end}</strong></div><div><span>Peringkat teratas</span><strong>{result.results[0]?.name} · {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(result.results[0]?.final_score ?? 0)}</strong></div><p>Hasil sudah tersimpan. Buka menu Hasil perangkingan untuk melihat seluruh nilai dan mencetak laporan.</p></section>}
  </main>;
}

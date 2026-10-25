import { useEffect, useState } from 'react';
import { Activity, ArrowRight, CalendarDays, ClipboardCheck, RefreshCw } from 'lucide-react';
import { apiUrl } from './api.js';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 });
const scoreFmt = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

export default function EvaluationPreviewPage({ mode = 'assessment' }) {
  const [start, setStart] = useState(today().slice(0, 8) + '01');
  const [end, setEnd] = useState(today());
  const [result, setResult] = useState(null);
  const [availableRange, setAvailableRange] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const calculationMode = mode === 'calculation';
  useEffect(() => {
    let active = true;
    fetch(apiUrl('/api/evaluations/periods'), { credentials: 'include' }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Rentang transaksi belum dapat dibaca.');
      if (!active) return;
      setAvailableRange(body.data);
      if (body.data.first_date && body.data.last_date) { setStart(body.data.first_date); setEnd(body.data.last_date); }
    }).catch(() => { if (active) setAvailableRange(null); });
    return () => { active = false; };
  }, []);
  const runPreview = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const query = new URLSearchParams({ period_start: start, period_end: end });
      const response = await fetch(apiUrl('/api/evaluations/preview?' + query), { credentials: 'include' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Data penilaian tidak berhasil dimuat.');
      setResult(body.data);
    } catch (issue) { setError(issue.message || 'Terjadi kesalahan saat menghitung pratinjau.'); }
    finally { setLoading(false); }
  };
  return <main className="page-content">
    <div className="page-heading"><div><div className="page-kicker">{calculationMode ? <Activity size={14}/> : <ClipboardCheck size={14}/>} ANALISIS <span>/</span> {calculationMode ? 'PRATINJAU SAW' : 'PENILAIAN PRODUK'}</div><h1>{calculationMode ? 'Perhitungan SAW' : 'Penilaian barang'}</h1><p>{calculationMode ? 'Hitung pratinjau SAW dari penjualan pada periode terpilih.' : 'Lihat nilai C1–C6 setiap produk yang dibentuk otomatis dari transaksi.'}</p></div></div>
    <div className="demo-notice"><div className="demo-notice__icon"><CalendarDays size={17}/></div><div><strong>Pratinjau baca-saja</strong><p>{calculationMode ? 'Perhitungan ini tidak disimpan dan tidak mengubah transaksi. Untuk menyimpan snapshot peringkat FINAL, admin menjalankan perhitungan melalui akunnya.' : 'Penilaian dihitung dari data transaksi; halaman ini tidak menyediakan nilai manual dan tidak mengubah database.'} C5 menghitung pelanggan dengan sedikitnya dua transaksi produk; C6 menghitung bulan berpenjualan dibagi jumlah bulan kalender pada periode.</p></div></div>
    {error&&<div className="auth-error" role="alert">{error}</div>}
    <section className="panel master-panel preview-panel"><div className="panel-heading"><div><div className="eyebrow">PERIODE PENJUALAN</div><h2>{calculationMode?'Hitung pratinjau SAW':'Bentuk matriks penilaian'}</h2><p>Semua produk aktif menjadi alternatif, termasuk yang belum memiliki penjualan.</p></div></div>{availableRange&&<div className="period-availability">{availableRange.transaction_count?<>Data transaksi tersedia <strong>{availableRange.first_date}</strong> sampai <strong>{availableRange.last_date}</strong> ({availableRange.transaction_count} baris transaksi).</>:<>Belum ada transaksi tersimpan. Periode dapat dipilih, tetapi nilai penjualan akan nol.</>}</div>}<form className="master-form evaluation-create-form" onSubmit={runPreview}><label className="form-label">Mulai periode<input type="date" required value={start} max={end} onChange={(event)=>setStart(event.target.value)}/></label><label className="form-label">Akhir periode<input type="date" required value={end} min={start} onChange={(event)=>setEnd(event.target.value)}/></label><button className="button button--primary" type="submit" disabled={loading}>{loading?<RefreshCw size={15} className="spin-icon"/>:<ArrowRight size={15}/>} {loading?'Menghitung…':'Hitung pratinjau'}</button></form></section>
    {result&&<>{result.transaction_count===0&&<div className="demo-notice"><div className="demo-notice__icon"><CalendarDays size={17}/></div><div><strong>Tidak ada penjualan pada rentang ini</strong><p>Produk tetap muncul sebagai alternatif, tetapi nilai penjualan dan skor tidak mewakili periode yang memiliki transaksi. Pilih rentang tanggal yang mencakup transaksi yang tersimpan.</p></div></div>}<section className="panel evaluation-summary"><div><span>Periode</span><strong>{result.period_start} – {result.period_end}</strong></div><div><span>Baris transaksi</span><strong>{result.transaction_count}</strong></div><div><span>Produk aktif</span><strong>{result.total_products}</strong></div><div><span>Kriteria</span><strong>{result.criteria.length} kriteria</strong></div><div><span>Status</span><strong>Pratinjau · tidak disimpan</strong></div></section>
      <section className="panel master-panel"><div className="panel-heading"><div><div className="eyebrow">{calculationMode?'HASIL PRATINJAU':'MATRIKS PENILAIAN'}</div><h2>Nilai produk dan peringkat sementara</h2><p>Setiap sel menampilkan nilai mentah dan nilai normalisasi rij.</p></div></div><div className="table-wrap"><table className="ranking-table evaluation-table"><thead><tr><th>RANK</th><th>PRODUK</th>{result.criteria.map((criterion)=> <th key={criterion.code}>{criterion.code}<small>{criterion.name}<br/>Bobot {fmt.format(Number(criterion.weight)*100)}%</small></th>)}<th>SKOR SAW</th></tr></thead><tbody>{result.results.map((row)=> <tr key={row.product_id}><td><span className="rank-number">{String(row.rank_position).padStart(2,'0')}</span></td><td><div className="item-cell"><strong>{row.name}</strong><span>{row.code} · {row.category} · {row.volume_ml} ml</span></div></td>{row.raw.map((value,index)=><td key={result.criteria[index].code}><strong>{fmt.format(Number(value))}</strong><small className="normalised-value">rij {fmt.format(Number(row.normalized[index]))}</small></td>)}<td><strong className="score-value">{scoreFmt.format(Number(row.final_score))}</strong></td></tr>)}</tbody></table></div><div className="panel-footer"><span>Benefit: xij ÷ nilai maksimum · Cost: nilai minimum ÷ xij</span><span>Skor: Σ bobot × rij</span></div></section><p className="evaluation-disclaimer">Pratinjau dihitung saat diminta berdasarkan data dan bobot saat ini. Snapshot permanen hanya dapat dibuat oleh admin dari menu Perhitungan SAW.</p></>}
  </main>;
}

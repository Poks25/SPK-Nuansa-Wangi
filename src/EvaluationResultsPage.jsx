import { useEffect, useState } from 'react';
import { FileText, Trophy } from 'lucide-react';
import { apiUrl } from './api.js';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 });
const score = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

export default function EvaluationResultsPage({ printable = false }) {
  const [evaluations, setEvaluations] = useState([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvaluations = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(apiUrl('/api/evaluations'), { credentials: 'include' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Riwayat perhitungan gagal dimuat.');
      setEvaluations(body.data || []);
      const current = selected || String(body.data?.[0]?.id || '');
      setSelected(current);
      if (current) await loadResult(current);
      else setResult(null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  const loadResult = async (id) => {
    if (!id) { setResult(null); return; }
    const response = await fetch(apiUrl('/api/evaluations/' + encodeURIComponent(id) + '/results'), { credentials: 'include' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Hasil perhitungan gagal dimuat.');
    setResult(body);
  };
  useEffect(() => { loadEvaluations(); }, []);
  const selectEvaluation = async (id) => {
    setSelected(id); setLoading(true); setError('');
    try { await loadResult(id); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const evaluation = result?.evaluation;
  const criteria = result?.criteria || [];
  const rows = result?.data || [];
  const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  return <main className="page-content">
    <div className="page-heading"><div><div className="page-kicker">{printable ? <FileText size={14}/> : <Trophy size={14}/>} HASIL SPK <span>/</span> {printable ? 'LAPORAN' : 'PERINGKAT'}</div><h1>{printable ? 'Laporan peringkat produk' : 'Hasil perangkingan'}</h1><p>Menampilkan snapshot perhitungan SAW yang sudah tersimpan di database.</p></div><div className="page-heading-actions print-hidden">{printable && <button className="button button--primary" onClick={() => window.print()}>Cetak laporan</button>}</div></div>
    {error && <div className="auth-error" role="alert">{error} <button onClick={loadEvaluations}>Muat ulang</button></div>}
    {evaluations.length > 0 && <div className="panel master-panel evaluation-toolbar"><label className="form-label">Pilih periode dan perhitungan<select value={selected} onChange={(e) => selectEvaluation(e.target.value)}>{evaluations.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.period_start} – {item.period_end} · {item.status}</option>)}</select></label>{evaluation && <span className="status-pill status-pill--draft">{evaluation.status}</span>}</div>}
    {loading ? <section className="panel master-panel master-empty">Memuat hasil…</section> : !evaluations.length ? <section className="panel master-panel master-empty"><strong>Belum ada hasil SAW.</strong><span>Snapshot perhitungan tersimpan akan tampil di sini.</span></section> : result && <>
      <section className="panel evaluation-summary"><div><span>Periode</span><strong>{evaluation.period_start} – {evaluation.period_end}</strong></div><div><span>Alternatif</span><strong>{evaluation.total_products}</strong></div><div><span>Status</span><strong>{evaluation.status}</strong></div><div><span>Disimpan</span><strong>{new Date(evaluation.created_at).toLocaleString('id-ID')}</strong></div></section>
      <section className="panel master-panel">
        <div className="panel-heading"><div><div className="eyebrow">{printable ? 'DOKUMEN LAPORAN' : 'URUTAN PRODUK'}</div><h2>{evaluation.title}</h2><p>Nilai mentah, normalisasi, dan skor berasal dari snapshot tersimpan.</p></div></div>
        <div className="table-wrap"><table className="ranking-table evaluation-table"><thead><tr><th>RANK</th><th>PRODUK</th>{criteria.map((item) => <th key={item.code}>{item.code}<small>{item.name}</small></th>)}<th>SKOR SAW</th></tr></thead><tbody>{rows.map((row) => <tr key={row.product_id}><td><span className="rank-number">{String(row.rank_position).padStart(2, '0')}</span></td><td><div className="item-cell"><strong>{row.name}</strong><span>{row.code} · {row.category} · {row.volume_ml} ml</span></div></td>{criteria.map((item, i) => <td key={item.code}><strong>{number.format(Number(row['raw_c' + (i + 1)]))}</strong><small className="normalised-value">rij {number.format(Number(row['norm_c' + (i + 1)]))}</small></td>)}<td><strong className="score-value">{score.format(Number(row.final_score))}</strong></td></tr>)}</tbody></table></div>
        <div className="panel-footer"><span>Bobot aktif saat ini: {criteria.map((item) => item.code + ' ' + number.format(Number(item.weight) * 100) + '%').join(' · ')}</span><span>Snapshot {evaluation.status}</span></div>
      </section>
      <p className="evaluation-disclaimer">Nilai yang ditampilkan berasal dari hasil tersimpan. Snapshot lama tidak dihitung ulang dengan rumus C5/C6 yang baru disepakati. Skema saat ini tidak menyimpan riwayat bobot per snapshot, sehingga label bobot menunjukkan bobot aktif sekarang, bukan rekaman bobot saat perhitungan lama dibuat.</p>
    </>}
  </main>;
}

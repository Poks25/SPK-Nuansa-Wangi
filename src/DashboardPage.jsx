import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, FileText, Package, Trophy } from 'lucide-react';
import { apiUrl } from './api.js';

const integer = new Intl.NumberFormat('id-ID');
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <article className="metric-card"><div className={'metric-icon metric-icon--' + tone}><Icon size={19}/></div><div className="metric-label">{label}</div><div className="metric-value-row"><strong className="metric-value">{value}</strong></div><div className="metric-note">{note}</div></article>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodType, setPeriodType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7));
  const period = useMemo(() => {
    if (periodType === 'day') return { from: selectedDate, to: selectedDate };
    if (periodType === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      return { from: `${selectedMonth}-01`, to: `${selectedMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}` };
    }
    return null;
  }, [periodType, selectedDate, selectedMonth]);

  useEffect(() => {
    let active = true;
    const query = period ? `?from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(period.to)}` : '';
    setLoading(true);
    setError('');
    fetch(apiUrl('/api/dashboard/summary' + query), { credentials: 'include' }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Ringkasan gagal dimuat.');
      if (active) setSummary(body);
    }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const latest = summary?.latestEvaluation;
  const periodLabel = periodType === 'day'
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Bangkok' }).format(new Date(`${selectedDate}T12:00:00`))
    : periodType === 'month'
      ? new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(`${selectedMonth}-15T12:00:00`))
      : 'Semua data tersimpan';
  const selectedDescription = periodType === 'all' ? 'akumulasi seluruh transaksi yang tersimpan' : `transaksi pada ${periodLabel}`;

  return <main className="page-content">
    <div className="page-heading"><div><div className="page-kicker"><Activity size={14}/> OVERVIEW <span>/</span> DASHBOARD</div><h1>Ringkasan penjualan.</h1><p>Gunakan pilihan periode untuk meninjau transaksi, unit terjual, omzet, dan snapshot peringkat.</p></div>
      <div className="page-heading-actions dashboard-period-control"><CalendarDays size={15}/>
        <label className="sr-only" htmlFor="dashboard-period-type">Periode ringkasan</label>
        <select id="dashboard-period-type" aria-label="Periode ringkasan" value={periodType} onChange={(event) => setPeriodType(event.target.value)}>
          <option value="all">Semua data</option><option value="day">Per tanggal</option><option value="month">Per bulan</option>
        </select>
        {periodType === 'day' && <input aria-label="Pilih tanggal dashboard" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}/>}
        {periodType === 'month' && <input aria-label="Pilih bulan dashboard" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}/>}
      </div>
    </div>
    {error && <div className="auth-error" role="alert">{error}</div>}
    {loading ? <section className="panel master-empty">Memuat ringkasan…</section> : summary && <>
      <div className="section-title-row"><div><h2>{periodType === 'all' ? 'Ringkasan semua data' : `Ringkasan: ${periodLabel}`}</h2><p>Angka transaksi, unit, dan omzet menampilkan {selectedDescription}; jumlah produk aktif tetap menunjukkan katalog saat ini.</p></div></div>
      <div className="metrics-grid">
        <StatCard icon={Package} label="Produk aktif" value={integer.format(summary.products)} note="Produk dalam katalog" tone="navy"/>
        <StatCard icon={FileText} label="Transaksi" value={integer.format(summary.transactions)} note={periodType === 'all' ? 'Semua transaksi tersimpan' : `Transaksi pada ${periodLabel}`} tone="blue"/>
        <StatCard icon={Activity} label="Unit terjual" value={integer.format(summary.unitsSold)} note="Jumlah pada rincian transaksi terpilih" tone="red"/>
        <StatCard icon={Trophy} label="Omzet tercatat" value={money.format(Number(summary.grossSales))} note="Akumulasi nilai transaksi terpilih" tone="gold"/>
      </div>
      <div className="main-panels">
        <section className="panel ranking-panel"><div className="panel-heading"><div><div className="eyebrow">HASIL TERSIMPAN</div><h2>Peringkat produk</h2><p>{latest ? latest.title + ' · ' + latest.period_start + ' – ' + latest.period_end : 'Belum ada snapshot FINAL untuk periode ini.'}</p></div></div>
          {!latest || !summary.ranking.length ? <div className="master-empty">{periodType === 'all' ? 'Hasil peringkat belum tersedia.' : 'Belum ada snapshot FINAL yang beririsan dengan periode pilihan.'}</div> : <div className="table-wrap"><table className="ranking-table"><thead><tr><th>RANK</th><th>PRODUK</th><th>SKOR</th></tr></thead><tbody>{summary.ranking.map((row) => <tr key={row.id}><td><span className="rank-number">{String(row.rank_position).padStart(2,'0')}</span></td><td><div className="item-cell"><strong>{row.name}</strong><span>{row.code} · {row.category} · {row.volume_ml} ml</span></div></td><td><strong className="score-value">{Number(row.final_score).toLocaleString('id-ID',{minimumFractionDigits:4,maximumFractionDigits:6})}</strong></td></tr>)}</tbody></table></div>}
        </section>
        <section className="panel readiness-panel"><div className="panel-heading panel-heading--tight"><div><div className="eyebrow">KONFIGURASI SAW</div><h2>Kesiapan kriteria</h2></div></div>
          <div className="readiness-list"><div><span>Kriteria aktif</span><strong>{summary.criteria.active}</strong></div><div><span>Bobot lengkap</span><strong>{summary.criteria.completeWeights ? 'Ya' : 'Belum'}</strong></div><div><span>Total bobot</span><strong>{(summary.criteria.weightTotal*100).toLocaleString('id-ID',{maximumFractionDigits:3})}%</strong></div><div><span>Snapshot terakhir</span><strong>{latest ? latest.status || 'FINAL' : 'Belum ada'}</strong></div></div>
          <div className="readiness-note"><Trophy size={15}/><span>Dashboard memakai transaksi nyata. Untuk tanggal atau bulan terpilih, peringkat memakai snapshot FINAL yang rentangnya beririsan dengan pilihan tersebut.</span></div>
        </section>
      </div>
      <footer className="page-footer"><span>© 2026 SPK NUANSA WANGI · Pemeringkatan Produk Parfum Terlaris</span><span><span className="footer-dot"/> Data MySQL tersimpan</span></footer>
    </>}
  </main>;
}

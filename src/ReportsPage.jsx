import { useEffect, useState } from 'react';
import { CalendarDays, FileSpreadsheet, FileText, Image, Printer, RefreshCw } from 'lucide-react';
import { apiUrl } from './api.js';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('id-ID');
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const escapeXml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const csvCell = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (range = applied) => {
    setLoading(true); setError('');
    try {
      const query = range.from && range.to ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}` : '';
      const response = await fetch(apiUrl('/api/reports/sales' + query), { credentials: 'include' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Laporan gagal dimuat.');
      setReport(body.data);
    } catch (issue) { setError(issue.message || 'Laporan gagal dimuat.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const applyRange = () => {
    if (Boolean(from) !== Boolean(to)) { setError('Isi tanggal mulai dan akhir, atau pilih Semua periode.'); return; }
    if (from && to && from > to) { setError('Tanggal mulai tidak boleh melewati tanggal akhir.'); return; }
    const range = { from, to }; setApplied(range); load(range);
  };
  const allPeriod = () => { setFrom(''); setTo(''); const range = { from: '', to: '' }; setApplied(range); load(range); };

  const exportCsv = (kind) => {
    if (!report) return;
    const rows = kind === 'products'
      ? [['Kode produk', 'Nama produk', 'Merek/kategori', 'Ukuran (ml)', 'Unit terjual', 'Transaksi', 'Omzet', 'Stok saat ini'], ...report.products.map((row) => [row.code, row.name, row.category, row.volume_ml, row.units_sold, row.transaction_count, row.gross_sales, row.current_stock])]
      : [['Nomor transaksi', 'Tanggal', 'Pelanggan', 'Baris produk', 'Unit', 'Total (Rp)', 'Jenis data', 'Catatan'], ...report.transactions.map((row) => [row.invoice_number, row.transaction_date, row.customer_name, row.line_count, row.unit_count, row.total_amount, String(row.notes || '').startsWith('DEMO:') || row.invoice_number.startsWith('DEMO-') ? 'DEMO' : 'Tersimpan', row.notes || ''])];
    const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
    downloadFile(`laporan-${kind === 'products' ? 'produk' : 'transaksi'}-${applied.from || 'semua-periode'}.csv`, 'text/csv;charset=utf-8', csv);
  };

  const exportJpg = async () => {
    if (!report) return;
    const rows = report.products.slice(0, 12);
    const width = 1400; const height = 290 + rows.length * 52;
    const text = (x, y, value, size = 20, weight = 400, color = '#24364b', anchor = 'start') => `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f4f9fb"/><rect x="28" y="24" width="${width-56}" height="${height-48}" rx="20" fill="#ffffff" stroke="#cfe2ea"/><text x="64" y="82" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="3" fill="#168caf">LAPORAN OPERASIONAL</text>${text(64,130,'SPK NUANSA WANGI',32,700,'#152c49')}${text(64,165,applied.from ? `Periode ${applied.from} sampai ${applied.to}` : 'Semua periode tersimpan',18,400,'#65798e')}${text(64,225,`Transaksi: ${integer.format(report.summary.transaction_count)}    Unit: ${integer.format(report.summary.units_sold)}    Omzet: ${money.format(Number(report.summary.gross_sales))}`,21,700)}<rect x="56" y="250" width="${width-112}" height="42" rx="7" fill="#eaf5f8"/>${text(76,278,'PRODUK',14,700,'#476176')}${text(720,278,'UNIT TERJUAL',14,700,'#476176','end')}${text(920,278,'TRANSAKSI',14,700,'#476176','end')}${text(1300,278,'OMZET',14,700,'#476176','end')}${rows.map((row,index)=>{const y=328+index*52;return `<line x1="56" y1="${y+13}" x2="${width-56}" y2="${y+13}" stroke="#e6edf1"/>${text(76,y,row.code+' · '+row.name,17,600)}${text(720,y,integer.format(Number(row.units_sold)),17,600,'#24364b','end')}${text(920,y,integer.format(Number(row.transaction_count)),17,600,'#24364b','end')}${text(1300,y,money.format(Number(row.gross_sales)),17,600,'#24364b','end')}`}).join('')}${text(64,height-67,'Ringkasan JPG menampilkan maksimal 12 produk teratas. Data contoh diberi label DEMO.',14,400,'#7b8b99')}</svg>`;
    const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new window.Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = imageUrl; });
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Gambar laporan tidak berhasil dibuat.');
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `laporan-ringkasan-${applied.from || 'semua-periode'}.jpg`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch { setError('File JPG tidak berhasil dibuat di browser ini. Coba cetak atau unduh CSV.'); }
    finally { URL.revokeObjectURL(imageUrl); }
  };

  const periodText = applied.from ? `${applied.from} – ${applied.to}` : 'Semua periode tersimpan';
  return <main className="page-content report-page">
    <div className="page-heading"><div><div className="page-kicker"><FileText size={14}/> DOKUMEN OPERASIONAL <span>/</span> LAPORAN</div><h1>Laporan penjualan & produk</h1><p>Ringkasan omzet, transaksi, dan kinerja produk dari data tersimpan di database.</p></div><div className="page-heading-actions print-hidden"><button className="button button--outline" onClick={() => window.print()}><Printer size={15}/> Cetak / Simpan PDF</button></div></div>
    <section className="panel report-filter print-hidden"><div className="report-filter-title"><CalendarDays size={17}/><div><strong>Periode laporan</strong><span>Tanggal mengikuti tanggal transaksi di sistem.</span></div></div><label className="form-label">Dari<input type="date" max={to || today()} value={from} onChange={(event) => setFrom(event.target.value)}/></label><label className="form-label">Sampai<input type="date" min={from || undefined} max={today()} value={to} onChange={(event) => setTo(event.target.value)}/></label><button className="button button--primary" onClick={applyRange} disabled={loading}>{loading?<RefreshCw size={14} className="spin-icon"/>:'Terapkan'}</button><button className="button button--outline" onClick={allPeriod} disabled={loading}>Semua periode</button></section>
    {error && <div className="auth-error print-hidden" role="alert">{error} <button onClick={() => load()}>Coba lagi</button></div>}
    {loading ? <section className="panel master-empty">Memuat laporan…</section> : report && <>
      <header className="report-document-header"><div><div className="eyebrow">SPK NUANSA WANGI · LAPORAN RESMI</div><h2>Laporan penjualan dan kinerja produk</h2><p>Periode: <strong>{periodText}</strong> · Dibuat: {new Date().toLocaleString('id-ID')}</p></div><span className="report-doc-mark">NW</span></header>
      <div className="metrics-grid report-metrics"><article className="metric-card"><div className="metric-label">Jumlah transaksi</div><strong className="metric-value">{integer.format(report.summary.transaction_count)}</strong><div className="metric-note">Nota tersimpan pada periode</div></article><article className="metric-card"><div className="metric-label">Unit terjual</div><strong className="metric-value">{integer.format(report.summary.units_sold)}</strong><div className="metric-note">Total kuantitas produk</div></article><article className="metric-card"><div className="metric-label">Omzet tercatat</div><strong className="metric-value">{money.format(Number(report.summary.gross_sales))}</strong><div className="metric-note">Jumlah nilai nota</div></article><article className="metric-card"><div className="metric-label">Rata-rata transaksi</div><strong className="metric-value">{money.format(Number(report.summary.average_transaction))}</strong><div className="metric-note">Rata-rata nilai per nota</div></article></div>
      <section className="panel master-panel report-section"><div className="panel-heading"><div><div className="eyebrow">TREN PENJUALAN</div><h2>Ringkasan per bulan</h2><p>Jumlah nota dan omzet per bulan pada periode terpilih.</p></div></div>{report.monthly.length?<div className="table-wrap"><table className="ranking-table"><thead><tr><th>BULAN</th><th>TRANSAKSI</th><th>OMZET</th></tr></thead><tbody>{report.monthly.map((row)=><tr key={row.month}><td>{new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(`${row.month}-15T12:00:00`))}</td><td>{integer.format(Number(row.transaction_count))}</td><td><strong>{money.format(Number(row.gross_sales))}</strong></td></tr>)}</tbody></table></div>:<div className="master-empty">Belum ada transaksi pada rentang ini.</div>}</section>
      <section className="panel master-panel report-section"><div className="panel-heading"><div><div className="eyebrow">SUMBER: KATALOG PRODUK + RINCIAN PENJUALAN</div><h2>Kinerja produk</h2><p>Diurutkan berdasarkan omzet pada periode laporan. Produk tanpa penjualan tetap disertakan.</p></div><div className="report-export print-hidden"><button className="button button--outline button--sm" onClick={() => exportCsv('products')}><FileSpreadsheet size={14}/> Excel Produk (CSV)</button></div></div><div className="table-wrap"><table className="ranking-table"><thead><tr><th>PRODUK</th><th>KATEGORI</th><th>UNIT</th><th>TRANSAKSI</th><th>OMZET</th><th>STOK</th></tr></thead><tbody>{report.products.map((row) => <tr key={row.id}><td><div className="item-cell"><strong>{row.name}</strong><span>{row.code} · {row.volume_ml} ml</span></div></td><td>{row.category}</td><td>{integer.format(Number(row.units_sold))}</td><td>{integer.format(Number(row.transaction_count))}</td><td><strong>{money.format(Number(row.gross_sales))}</strong></td><td>{integer.format(Number(row.current_stock))}</td></tr>)}</tbody></table></div></section>
      <section className="panel master-panel report-section"><div className="panel-heading"><div><div className="eyebrow">SUMBER: SALES TRANSACTIONS</div><h2>Rincian transaksi</h2><p>Menampilkan maksimal 250 transaksi terbaru pada periode laporan. Data contoh ditandai DEMO.</p></div><div className="report-export print-hidden"><button className="button button--outline button--sm" onClick={() => exportCsv('transactions')}><FileSpreadsheet size={14}/> Excel Transaksi (CSV)</button><button className="button button--outline button--sm" onClick={exportJpg}><Image size={14}/> Ringkasan JPG</button></div></div>{report.transactions.length?<div className="table-wrap"><table className="ranking-table"><thead><tr><th>NOMOR</th><th>TANGGAL</th><th>PELANGGAN</th><th>BARIS</th><th>UNIT</th><th>TOTAL</th><th>SUMBER</th></tr></thead><tbody>{report.transactions.map((row) => {const demo=String(row.notes||'').startsWith('DEMO:')||row.invoice_number.startsWith('DEMO-');return <tr key={row.id}><td>{row.invoice_number}</td><td>{row.transaction_date}</td><td>{row.customer_name}</td><td>{row.line_count}</td><td>{row.unit_count}</td><td><strong>{money.format(Number(row.total_amount))}</strong></td><td><span className={demo?'report-source report-source--demo':'report-source'}>{demo?'DEMO':'Tersimpan'}</span></td></tr>})}</tbody></table></div>:<div className="master-empty"><strong>Tidak ada transaksi pada periode ini.</strong><span>Coba pilih rentang tanggal lain.</span></div>}</section>
      <div className="report-footer"><span>Dokumen dibuat otomatis dari data tersimpan SPK Nuansa Wangi.</span><span>Data sintetis ditandai DEMO dan bukan transaksi aktual.</span></div>
    </>}
  </main>;
}

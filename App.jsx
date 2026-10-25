import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { apiUrl } from './api.js';
import TransactionsPage from './TransactionsPage.jsx';
import EvaluationResultsPage from './EvaluationResultsPage.jsx';
import ReportsPage from './ReportsPage.jsx';
import EvaluationCreatePage from './EvaluationCreatePage.jsx';
import EvaluationPreviewPage from './EvaluationPreviewPage.jsx';
import AccountSettingsPage from './AccountSettingsPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Bell, Boxes, CalendarDays, CheckCircle2, ChevronDown, CircleHelp,
  ClipboardCheck, Clock3, Command, Database, FileText, Gauge, KeyRound,
  LayoutDashboard, LogOut, Menu, Package, Search, ShieldCheck,
  SlidersHorizontal, Sparkles, Sun, Moon, Settings as SettingsIcon, Trophy, X,
} from 'lucide-react';

const adminMenu = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', status: 'active' },
  { label: 'Produk parfum', icon: Package, path: '/products' },
  { label: 'Transaksi penjualan', icon: FileText, path: '/transactions' },
  { label: 'Data kriteria', icon: SlidersHorizontal, path: '/criteria' },
  { label: 'Data subkriteria', icon: Boxes, path: '/subcriteria' },
  { label: 'Bobot kriteria', icon: Gauge, path: '/weights' },
  { label: 'Penilaian barang', icon: ClipboardCheck, path: '/assessment' },
  { label: 'Perhitungan SAW', icon: Activity, path: '/calculations' },
  { label: 'Hasil perangkingan', icon: Trophy, path: '/rankings' },
  { label: 'Laporan', icon: FileText, path: '/reports' },
  { label: 'Username & password', icon: KeyRound, path: '/account-settings' },
  { label: 'Pengaturan', icon: SettingsIcon, path: '/settings' },
];

function BrandMark({ compact = false, logo }) {
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''}`}>
      <div className="brand-mark"><img src={logo || "/spk-nuansa-wangi-logo.png"} alt="Logo SPK Nuansa Wangi" /></div>
      {!compact && <div className="brand-copy"><strong>SPK<span> NUANSA WANGI</span></strong><small>DECISION SUPPORT</small></div>}
    </div>
  );
}

function DemoTag({ children = 'DEMO' }) {
  return <span className="demo-tag"><span className="demo-tag__dot" />{children}</span>;
}

function Sidebar({ mobileOpen, closeMobile, user, onSignOut, logo }) {
  const location = useLocation();
  const leaderPaths = new Set(['/dashboard', '/assessment', '/calculations', '/rankings', '/reports']);
  const menu = user.role === 'ADMIN' ? adminMenu : adminMenu.filter((item) => leaderPaths.has(item.path));
  return (
    <>
      {mobileOpen && <button className="sidebar-scrim" onClick={closeMobile} aria-label="Tutup menu" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand"><BrandMark logo={logo} /><button className="icon-button sidebar-close" onClick={closeMobile} aria-label="Tutup navigasi"><X size={18} /></button></div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">AP</div>
          <div className="workspace-copy"><strong>Best Seller Parfum</strong><span>Workspace internal</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Navigasi utama">
          {menu.map((item) => {
            const Icon = item.icon;
            if (item.path) {
              return <Link key={item.label} to={item.path} onClick={closeMobile} className={`nav-item ${location.pathname === item.path ? 'nav-item--active' : ''}`}><Icon size={18} /><span>{item.label}</span>{location.pathname === item.path && <span className="nav-active-dot" />}</Link>;
            }
            return <div key={item.label} className="nav-item nav-item--disabled" title={`Akan tersedia pada ${item.phase}`}><Icon size={18} /><span>{item.label}</span><span className="nav-phase">{item.phase}</span></div>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><div><strong>Butuh bantuan?</strong><span>Dokumentasi proyek</span></div><ArrowUpRight size={14} /></div>
          <div className="sidebar-user"><div className="user-avatar">{user.role === 'ADMIN' ? 'AD' : 'PI'}</div><div className="user-info"><strong>{user.name}</strong><span>{user.role === 'ADMIN' ? 'Administrator' : 'Pimpinan'}</span></div><button className="icon-button sidebar-user-menu" onClick={onSignOut} aria-label="Keluar"><LogOut size={17} /></button></div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu, onToast, user, onSignOut, theme, onToggleTheme }) {
  const location = useLocation();
  const section = adminMenu.find((item) => item.path === location.pathname)?.label || 'Dashboard';
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Buka navigasi"><Menu size={19} /></button>
        <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{section}</strong></div>
      </div>
      <div className="topbar-actions">
        <label className="search-field"><Search size={16} /><input value="" disabled placeholder="Pencarian belum tersedia" aria-label="Pencarian belum tersedia" /><kbd>⌘ K</kbd></label>
        <button className="icon-button theme-toggle" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Ganti ke mode biru muda' : 'Ganti ke mode biru tua'} title={theme === 'dark' ? 'Mode biru muda' : 'Mode biru tua'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button" onClick={() => onToast('Notifikasi belum tersedia.')} aria-label="Notifikasi belum tersedia"><Bell size={18} /><span /></button>
        <div className="topbar-divider" />
        <button className="topbar-profile" onClick={onSignOut} title="Keluar"><div className="user-avatar user-avatar--small">{user.role === 'ADMIN' ? 'AD' : 'PI'}</div><div className="topbar-profile-copy"><strong>{user.name}</strong><span>{user.role === 'ADMIN' ? 'Administrator' : 'Pimpinan'}</span></div><LogOut size={15} aria-hidden="true" /></button>
      </div>
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone = 'navy', trend, trendDirection = 'up' }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon--${tone}`}><Icon size={19} strokeWidth={1.9} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value-row"><strong className="metric-value">{value}</strong>{trend && <span className={`trend trend--${trendDirection}`}>{trendDirection === 'down' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{trend}</span>}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

const demoRank = [
  { rank: '01', name: 'Parfum Demo Floral', group: 'Kemasan · BOT-030', score: '0,92', tone: 'gold', progress: '92%' },
  { rank: '02', name: 'Parfum Demo Woody', group: 'Kategori DEMO', score: '0,88', tone: 'silver', progress: '88%' },
  { rank: '03', name: 'Parfum Demo Citrus', group: 'Kategori DEMO', score: '0,84', tone: 'bronze', progress: '84%' },
  { rank: '04', name: 'Parfum Demo Fresh', group: 'Komponen · CMP-SPR', score: '0,76', tone: '', progress: '76%' },
];

function RankingPreview() {
  return (
    <section className="panel ranking-panel">
      <div className="panel-heading"><div><div className="eyebrow">DECISION INSIGHT</div><h2>Produk parfum terlaris</h2><p>Contoh urutan rekomendasi berdasarkan nilai SAW.</p></div><button className="button button--subtle button--sm" disabled title="Aktif pada Phase 5">Lihat semua <ArrowRight size={14} /></button></div>
      <div className="table-wrap">
        <table className="ranking-table"><thead><tr><th>RANK</th><th>PRODUK PARFUM</th><th>SKOR AKHIR</th><th>INDIKATOR</th></tr></thead><tbody>
          {demoRank.map((item) => <tr key={item.rank}><td><span className={`rank-number ${item.tone ? `rank-number--${item.tone}` : ''}`}>{item.rank}</span></td><td><div className="item-cell"><strong>{item.name}</strong><span>{item.group}</span></div></td><td><strong className="score-value">{item.score}</strong></td><td><div className="score-track"><span style={{ width: item.progress }} /></div></td></tr>)}
        </tbody></table>
      </div>
      <div className="panel-footer"><span><span className="legend-dot" /> Data ilustrasi / demo</span><span>Nilai bukan hasil penelitian</span></div>
    </section>
  );
}

function ReadinessPanel() {
  return (
    <section className="panel readiness-panel">
      <div className="panel-heading panel-heading--tight"><div><div className="eyebrow">DATA READINESS</div><h2>Kesiapan penilaian</h2></div><span className="icon-button" title="Informasi demo" aria-hidden="true"><CircleHelp size={17} /></span></div>
      <div className="readiness-summary"><div><strong>75<span>%</span></strong><p>kelengkapan data demo</p></div><div className="readiness-ring"><div className="readiness-ring__inner"><span>18/24</span><small>alternatif</small></div></div></div>
      <div className="readiness-progress"><div><span style={{ width: '75%' }} /></div></div>
      <div className="readiness-list"><div><span className="readiness-status readiness-status--ready"><CheckCircle2 size={14} /></span><span>Data alternatif</span><strong>24</strong></div><div><span className="readiness-status readiness-status--warning"><AlertTriangle size={14} /></span><span>Transaksi penjualan</span><strong>5</strong></div><div><span className="readiness-status readiness-status--muted"><Clock3 size={14} /></span><span>Penilaian belum lengkap</span><strong>6</strong></div></div>
      <div className="readiness-note"><ShieldCheck size={15} /><span>SAW tersedia setelah kriteria disepakati dan diimplementasikan.</span></div>
    </section>
  );
}

function QuickInfoPanel() {
  return (
    <section className="panel criteria-panel">
      <div className="panel-heading panel-heading--tight"><div><div className="eyebrow">MODEL OVERVIEW</div><h2>Model kriteria</h2></div><span className="status-pill status-pill--draft">DRAFT</span></div>
      <p className="criteria-description">Kriteria dan bobot tersimpan di database; hasil dashboard ini tetap berlabel DEMO.</p>
      <div className="criteria-bars"><p>Kriteria dan bobot penelitian belum ditetapkan. Rujuk konfigurasi tersimpan sebelum menafsirkan hasil ranking.</p></div>
      <div className="criteria-footnote"><AlertTriangle size={14} /><span>Tidak ada bobot penelitian yang ditampilkan sebelum disetujui.</span></div>
    </section>
  );
}

function Dashboard({ onToast }) {
  return (
    <main className="page-content">
      <div className="page-heading"><div><div className="page-kicker"><Sparkles size={14} /> OVERVIEW <span>/</span> DASHBOARD</div><h1>Selamat datang.</h1><p>Pantau kesiapan data dan gambaran pemeringkatan produk parfum terlaris.</p></div><div className="page-heading-actions"><span className="date-chip"><CalendarDays size={15} /> {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date())}</span><DemoTag>DATA DEMO</DemoTag></div></div>
      <div className="demo-notice"><div className="demo-notice__icon"><ShieldCheck size={17} /></div><div><strong>Akses terlindungi · Phase 2</strong><p>Login dan pembatasan peran aktif. Angka, skor, dan nama barang pada dashboard ini masih data ilustrasi (DEMO).</p></div><button className="notice-dismiss" onClick={() => onToast('Angka pada dashboard ini masih data DEMO.')} aria-label="Informasi data demo"><CircleHelp size={17} /></button></div>
      <div className="section-title-row"><div><h2>Ringkasan produk</h2><p>Snapshot contoh untuk tampilan antarmuka.</p></div><button className="button button--outline button--sm" onClick={() => onToast('Penyegaran data aktif setelah API data tersedia pada fase berikutnya.')}><Activity size={14} /> Status sistem</button></div>
      <div className="metrics-grid">
        <MetricCard icon={Package} label="Total alternatif" value="24" note="Produk pada ilustrasi demo" tone="navy" />
        <MetricCard icon={AlertTriangle} label="Transaksi penjualan" value="05" note="Contoh data ilustrasi" tone="red" trend="+2" trendDirection="up" />
        <MetricCard icon={ClipboardCheck} label="Penilaian lengkap" value="18/24" note="75% dari alternatif demo" tone="blue" />
        <MetricCard icon={Trophy} label="Hasil ranking" value="—" note="Belum ada hasil riil" tone="gold" />
      </div>
      <div className="main-panels"><RankingPreview /><div className="side-panels"><ReadinessPanel /><QuickInfoPanel /></div></div>
      <div className="bottom-note"><div className="bottom-note__mark"><Database size={17} /></div><div><strong>Ringkasan transaksi belum tersedia</strong><p>Dashboard ini masih menampilkan ilustrasi sampai data transaksi dan hasil peringkat siap digunakan.</p></div><span className="phase-label">PHASE 2</span></div>
      <footer className="page-footer"><span>© 2026 SPK NUANSA WANGI · Pemeringkatan Produk Parfum Terlaris</span><span><span className="footer-dot" /> Login aktif · data DEMO</span><button onClick={() => onToast('Hubungi administrator proyek untuk bantuan.')}><CircleHelp size={13} /> Bantuan</button></footer>
    </main>
  );
}

const masterConfig = {
  products: { title: 'Produk parfum', singular: 'produk parfum', fields: [['code','Kode produk','generated'],['name','Nama produk'],['category','Merek / kategori'],['volume_ml','Ukuran (ml)','number'],['price','Harga jual (Rp)','currency'],['current_stock','Stok tersedia','number'],['notes','Catatan']], columns: [['code','Kode'],['name','Nama produk'],['category','Merek / kategori'],['volume_ml','Ukuran (ml)'],['price','Harga jual'],['current_stock','Stok']] },
  criteria: { title: 'Data kriteria', singular: 'kriteria', fields: [['code','Kode kriteria'],['name','Nama kriteria'],['description','Deskripsi'],['criterion_type','Tipe'],['display_order','Urutan','number']], columns: [['code','Kode'],['name','Kriteria'],['criterion_type','Tipe'],['display_order','Urutan']] },
  subcriteria: { title: 'Data subkriteria', singular: 'subkriteria', fields: [['criterion_id','Kriteria','select'],['label','Label'],['score','Skor','number'],['description','Deskripsi']], columns: [['criterion_name','Kriteria'],['label','Label'],['score','Skor'],['description','Deskripsi']] },
};
function MasterDataPage({ user }) {
  const { resource } = useParams();
  const config = masterConfig[resource];
  const [rows, setRows] = useState([]); const [criteria, setCriteria] = useState([]); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null); const [priceText, setPriceText] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const isAdmin = user.role === 'ADMIN';
  const load = async () => { setLoading(true); setError(''); try { const response = await fetch(apiUrl(`/api/${resource}`), { credentials: 'include' }); const body = await response.json(); if (!response.ok) throw new Error(body.message || 'Data gagal dimuat.'); setRows(body.data || []); if (resource === 'subcriteria') { const c = await fetch(apiUrl('/api/criteria'), { credentials: 'include' }); setCriteria((await c.json()).data || []); } } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); setEditing(null); }, [resource]);
  const visible = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()) && (resource !== 'products' || statusFilter === '' || String(Boolean(row.is_active)) === statusFilter));
  if (!config) return <Navigate to="/dashboard" replace />;
  const blank = Object.fromEntries(config.fields.map(([key]) => [key, key === 'current_stock' || key === 'display_order' ? '0' : key === 'price' ? '0' : key === 'volume_ml' ? '50' : key === 'criterion_type' ? 'BENEFIT' : key === 'minimum_stock' || key === 'notes' || key === 'description' ? '' : key === 'is_active' ? true : '']));
  const formatPrice = (value) => { const amount = Number(String(value ?? '').replace(/,/g, '')); return Number.isFinite(amount) ? amount.toLocaleString('id-ID', { maximumFractionDigits: 0 }) : ''; };
  const nextProductCode = 'NW-' + String(rows.reduce((max, row) => { const match = String(row.code || '').match(/^NW-(\d+)$/i); return match ? Math.max(max, Number(match[1])) : max; }, 0) + 1).padStart(3, '0');
  return <main className="page-content"><div className="page-heading"><div><div className="page-kicker"><Database size={14}/> DATA MASTER <span>/</span> PHASE 3</div><h1>{config.title}</h1><p>Kelola data tersimpan di database aplikasi. Belum ada data contoh penelitian.</p></div>{isAdmin && <button className="button button--primary" disabled={loading || Boolean(error)} onClick={() => { setEditing({ ...blank, ...(resource === 'products' ? { code: nextProductCode } : {}), is_active: true }); setPriceText(resource === 'products' ? '0' : ''); setError(''); }}>+ Tambah {config.singular}</button>}</div>
    {resource === 'criteria' && <div className="demo-notice"><div className="demo-notice__icon"><AlertTriangle size={17}/></div><div><strong>Konfigurasi kriteria tersimpan</strong><p>Periksa nama, tipe, dan bobot terhadap validasi penelitian sebelum menjalankan perhitungan.</p></div></div>}
    {error && <div className="auth-error" role="alert">{error} <button onClick={load}>Coba lagi</button></div>}
    <section className="panel master-panel"><div className="master-toolbar"><input aria-label="Cari data" placeholder={`Cari ${config.singular}…`} value={search} onChange={(e) => setSearch(e.target.value)}/>{resource === 'products' && <select aria-label="Filter status" onChange={(e) => setStatusFilter(e.target.value)}><option value="">Semua status</option><option value="true">Aktif</option><option value="false">Nonaktif</option></select>}<span>{visible.length} data</span></div>
    {loading ? <div className="master-empty">Memuat data…</div> : visible.length === 0 ? <div className="master-empty"><strong>Belum ada {config.singular}.</strong><span>Tambahkan data yang telah divalidasi terlebih dahulu.</span></div> : <div className="table-wrap"><table className="ranking-table"><thead><tr>{config.columns.map(([key,label])=><th key={key}>{label}</th>)}<th>STATUS</th>{isAdmin&&<th>AKSI</th>}</tr></thead><tbody>{visible.map((row)=><tr key={row.id}>{config.columns.map(([key])=><td key={key}>{key==='price' ? 'Rp ' + formatPrice(row.price) : key==='is_active'? (row[key]?'Aktif':'Nonaktif') : (key==='criterion_name'? criteria.find(c=>c.id===row.criterion_id)?.name || '—' : row[key] ?? '—')}</td>)}<td>{row.is_active === false || row.is_active === 0 ? 'Nonaktif':'Aktif'}</td>{isAdmin&&<td><button className="button button--subtle button--sm" onClick={()=>{setEditing({...row});setPriceText(formatPrice(row.price));setError('')}}>Ubah</button> <button className="button button--subtle button--sm" onClick={async()=>{if(!window.confirm(resource === 'products' ? 'Produk akan dinonaktifkan dan tetap tersimpan. Lanjutkan?' : 'Hapus data ini?'))return;try{const r=await fetch(apiUrl(`/api/${resource}/${row.id}`),{method:'DELETE',credentials:'include'});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message);load()}catch(e){setError(e.message||'Data masih digunakan.')}}}>{resource === 'products' ? 'Nonaktifkan' : 'Hapus'}</button></td>}</tr>)}</tbody></table></div>}</section>
    {editing && <div className="master-modal-backdrop"><section className="panel master-modal"><div className="panel-heading"><div><div className="eyebrow">FORM DATA</div><h2>{editing.id?'Ubah':'Tambah'} {config.singular}</h2></div><button className="button button--subtle" onClick={()=>setEditing(null)}>Tutup</button></div><form className="master-form" onSubmit={async(e)=>{e.preventDefault();setError('');const payload={...editing};config.fields.forEach(([key,,type])=>{if(type==='number'&&payload[key]!==''&&payload[key]!==null)payload[key]=Number(payload[key]);if(type==='currency')payload[key]=Number(String(priceText).replace(/\D/g,'')||0);if(key==='criterion_id')payload[key]=Number(payload[key]);});payload.is_active=Boolean(payload.is_active);try{const r=await fetch(apiUrl(`/api/${resource}${editing.id?`/${editing.id}`:''}`),{method:editing.id?'PUT':'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const b=await r.json();if(!r.ok)throw new Error(b.message);setEditing(null);load()}catch(e){setError(e.message)}}}>{config.fields.map(([key,label,type])=><label className="form-label" key={key}>{label}{type==='generated'?<input value={editing[key]||nextProductCode} readOnly aria-readonly='true' title='Kode produk dibuat otomatis oleh sistem'/>:type==='select'?<select required value={editing[key]||''} onChange={e=>setEditing({...editing,[key]:e.target.value})}><option value="">Pilih kriteria</option>{criteria.map(c=><option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}</select>:key==='criterion_type'?<select value={editing[key]||'BENEFIT'} onChange={e=>setEditing({...editing,[key]:e.target.value})}><option value="BENEFIT">Benefit</option><option value="COST">Cost</option></select>:type==='currency'?<input required type="text" inputMode="numeric" autoComplete="off" placeholder="Contoh: 35.000" value={priceText} onChange={e=>{const digits=e.target.value.replace(/\D/g,'');setPriceText(digits);setEditing({...editing,[key]:digits})}} onBlur={()=>setPriceText(formatPrice(priceText))} aria-describedby="price-format-help"/>:<input required={!['notes','description','minimum_stock'].includes(key)} type={type==='number'?'number':'text'} step={type==='number'?'any':undefined} min={type==='number'?'0':undefined} maxLength={key==='code'?40:160} value={editing[key]??''} onChange={e=>setEditing({...editing,[key]:e.target.value})}/>}</label>)}{resource==='products'&&<small id="price-format-help" className="muted-small">Masukkan angka rupiah, misalnya 35.000. Sistem menyimpan nilai sebagai angka.</small>}<label className="form-label master-check"><input type="checkbox" checked={Boolean(editing.is_active)} onChange={e=>setEditing({...editing,is_active:e.target.checked})}/> Aktif</label>{error&&<div role="alert" className="auth-error">{error}</div>}<button className="button button--primary" type="submit">Simpan</button></form></section></div>}
  </main>;
}
function WeightsPage({ user }) {
  const [rows,setRows]=useState([]); const [error,setError]=useState('');const [valid,setValid]=useState(false);const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const r=await fetch(apiUrl('/api/weights'),{credentials:'include'});const b=await r.json();if(!r.ok)throw new Error(b.message);setRows(b.data.map(x=>({...x,weight:x.weight??''})));setValid(b.valid)}catch(e){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]); const total=rows.filter(r=>r.is_active).reduce((n,r)=>n+Number(r.weight||0),0); const isAdmin=user.role==='ADMIN';
  return <main className="page-content"><div className="page-heading"><div><div className="page-kicker"><Gauge size={14}/> KONFIGURASI <span>/</span> PHASE 3</div><h1>Bobot kriteria</h1><p>Bobot disimpan dalam skala 0–1; total kriteria aktif wajib 1,00 (100%).</p></div></div>{error&&<div className="auth-error" role="alert">{error} <button onClick={load}>Coba lagi</button></div>}<section className="panel master-panel"><div className="weight-status"><strong>Total bobot aktif</strong><span>{(total*100).toLocaleString('id-ID',{maximumFractionDigits:4})}%</span><small>{valid?'Valid':'Belum valid — total harus 100% dan setiap kriteria aktif berbobot positif'}</small></div>{loading?<div className="master-empty">Memuat data…</div>:!rows.length?<div className="master-empty"><strong>Belum ada kriteria.</strong><span>Buat kriteria sebelum mengatur bobot.</span></div>:<div className="table-wrap"><table className="ranking-table"><thead><tr><th>KODE</th><th>KRITERIA</th><th>STATUS</th><th>BOBOT (%)</th></tr></thead><tbody>{rows.map(row=><tr key={row.criterion_id}><td>{row.code}</td><td>{row.name}</td><td>{row.is_active?'Aktif':'Nonaktif'}</td><td><input className="weight-input" aria-label={`Bobot ${row.name} persen`} type="number" min="0.0001" max="100" step="0.01" disabled={!isAdmin||!row.is_active} value={row.weight===''?'':Number(row.weight)*100} onChange={e=>setRows(old=>old.map(item=>item.criterion_id===row.criterion_id?{...item,weight:e.target.value===''?'':Number(e.target.value)/100}:item))}/></td></tr>)}</tbody></table></div>}{isAdmin&&rows.length>0&&<div className="master-actions"><button className="button button--primary" disabled={Math.abs(total-1)>0.0001||rows.filter(r=>r.is_active).some(r=>Number(r.weight)<=0)} onClick={async()=>{setError('');try{const r=await fetch(apiUrl('/api/weights'),{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({weights:rows.filter(x=>x.is_active).map(x=>({criterion_id:x.criterion_id,weight:Number(x.weight)}))})});const b=await r.json();if(!r.ok)throw new Error(b.message);await load()}catch(e){setError(e.message)}}}>Simpan bobot</button></div>}</section></main>;
}

function AppShell({ onToast, user, onSignOut, theme, onToggleTheme, logo, onLogoChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-frame"><Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} user={user} onSignOut={onSignOut} logo={logo} /><div className="app-main"><Topbar onMenu={() => setMobileOpen(true)} onToast={onToast} user={user} onSignOut={onSignOut} theme={theme} onToggleTheme={onToggleTheme} /><Routes><Route path="/dashboard" element={<DashboardPage />} /><Route path="/transactions" element={user.role === 'ADMIN' ? <TransactionsPage /> : <Navigate to="/dashboard" replace />} /><Route path="/calculations" element={user.role === 'ADMIN' ? <EvaluationCreatePage /> : <EvaluationPreviewPage mode="calculation" />} /><Route path="/assessment" element={<EvaluationPreviewPage mode="assessment" />} /><Route path="/account-settings" element={user.role === 'ADMIN' ? <AccountSettingsPage onSignOut={onSignOut} onToast={onToast} /> : <Navigate to="/dashboard" replace />} /><Route path="/settings" element={user.role === 'ADMIN' ? <SettingsPage theme={theme} onToggleTheme={onToggleTheme} logo={logo} onLogoChange={onLogoChange} onToast={onToast} /> : <Navigate to="/dashboard" replace />} /><Route path="/rankings" element={<EvaluationResultsPage />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/weights" element={<WeightsPage user={user}/>} /><Route path="/:resource" element={<MasterDataPage user={user}/>} /><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></div></div>;
}

function LoginPage({ theme, onToggleTheme, logo }) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <main className="login-page">
      <div className="login-atmosphere login-atmosphere--one" /><div className="login-atmosphere login-atmosphere--two" />
      <div className="login-topline"><BrandMark logo={logo} /><div className="login-topline-actions"><button className="icon-button theme-toggle" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Ganti ke mode biru muda' : 'Ganti ke mode biru tua'} title={theme === 'dark' ? 'Mode biru muda' : 'Mode biru tua'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button></div></div>
      <div className="login-layout">
        <section className="login-story"><div className="story-eyebrow"><span /> PEMERINGKATAN PRODUK PARFUM TERLARIS</div><h1>Produk parfum terlaris<br /><em>yang lebih jelas.</em></h1><p>Ruang kerja untuk membantu pemeringkatan produk parfum terlaris dari transaksi penjualan menggunakan metode SAW.</p><div className="story-benefits"><div><div className="benefit-icon"><SlidersHorizontal size={17} /></div><span><strong>Kriteria terukur</strong><small>Evaluasi kebutuhan berdasarkan parameter.</small></span></div><div><div className="benefit-icon"><Trophy size={17} /></div><span><strong>Prioritas lebih jelas</strong><small>Susun rekomendasi secara sistematis.</small></span></div><div><div className="benefit-icon"><ShieldCheck size={17} /></div><span><strong>Keputusan tetap di tangan Anda</strong><small>Sistem mendukung, pemilik menentukan.</small></span></div></div><div className="login-story-foot"><span className="story-line" /><span>SISTEM PENDUKUNG KEPUTUSAN BEST SELLER</span></div></section>
        <section className="login-card"><div className="login-card-top"><div className="login-card-symbol"><KeyRound size={20} /></div><span className="status-pill status-pill--draft">AKSES INTERNAL</span></div><h2>{showRecovery ? 'Atur ulang password.' : 'Selamat datang.'}</h2><p className="login-subtitle">{showRecovery ? 'Masukkan kode pemulihan yang disiapkan administrator.' : 'Masuk ke workspace SPK Nuansa Wangi.'}</p><div className="login-demo-alert"><ShieldCheck size={15} /><span>{showRecovery ? 'Kode pemulihan tersimpan pada konfigurasi server. Jangan bagikan kode ini.' : 'Gunakan akun yang disiapkan administrator sistem.'}</span></div>{showRecovery ? <form onSubmit={async (event) => { event.preventDefault(); setRecoveryMessage(''); setRecoverySuccess(false); if (newPassword !== confirmNewPassword) { setRecoveryMessage('Konfirmasi password baru belum sama.'); return; } setSubmitting(true); try { const response = await fetch(apiUrl('/api/auth/forgot-password'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, recoveryCode, password: newPassword }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.message || 'Password belum dapat diatur ulang.'); setRecoveryMessage(body.message); setRecoverySuccess(true); setPassword(''); setNewPassword(''); setConfirmNewPassword(''); setRecoveryCode(''); } catch (requestError) { setRecoveryMessage(requestError.message || 'Password belum dapat diatur ulang.'); } finally { setSubmitting(false); } }}><label className="form-label" htmlFor="recovery-username">Username akun</label><div className="login-input-wrap"><span>@</span><input id="recovery-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength={254} required /></div><label className="form-label" htmlFor="recovery-code">Kode pemulihan</label><div className="login-input-wrap"><KeyRound size={16} /><input id="recovery-code" type="password" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} autoComplete="off" maxLength={256} required /></div><label className="form-label" htmlFor="new-password">Password baru</label><div className="login-input-wrap"><KeyRound size={16} /><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" maxLength={1024} required /></div><label className="form-label" htmlFor="confirm-new-password">Ulangi password baru</label><div className="login-input-wrap"><KeyRound size={16} /><input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} autoComplete="new-password" maxLength={1024} required /></div>{recoveryMessage && <div className={recoverySuccess ? 'recovery-success' : 'auth-error'} role={recoverySuccess ? 'status' : 'alert'}>{recoveryMessage}</div>}<button className="login-submit" type="submit" disabled={submitting || newPassword !== confirmNewPassword}>{submitting ? 'Menyimpan…' : 'Atur ulang password'}</button><button type="button" className="recovery-back-link" onClick={() => { setShowRecovery(false); setRecoveryMessage(''); }}>Kembali ke halaman masuk</button></form> : <form onSubmit={async (event) => { event.preventDefault(); setError(''); setSubmitting(true); try { await login(username, password); navigate('/dashboard', { replace: true }); } catch (requestError) { setError(requestError.message); } finally { setSubmitting(false); } }}><label className="form-label" htmlFor="username">Email atau username</label><div className="login-input-wrap"><span>@</span><input id="username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength={254} required /></div><label className="form-label" htmlFor="password">Password</label><div className="login-input-wrap"><KeyRound size={16} /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength={1024} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? 'Sembunyi' : 'Lihat'}</button></div>{error && <div className="auth-error" role="alert">{error}</div>}<div className="login-options"><span className="muted-small">Sesi berakhir setelah 8 jam</span><button type="button" className="recovery-link" onClick={() => { setShowRecovery(true); setError(''); setRecoveryMessage(''); }}>Lupa password?</button></div><button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Memeriksa…' : 'Masuk'} {!submitting && <ArrowRight size={16} />}</button></form>}<div className="login-card-footer"><span><ShieldCheck size={13} /> Koneksi aman</span><span>v0.2.0</span></div></section>
      </div>
      <div className="login-bottom"><span>© 2026 SPK NUANSA WANGI. Pemeringkatan produk parfum terlaris.</span><span>PRIORITAS · TRANSPARANSI · KONTROL</span></div>
    </main>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return <div className="toast" role="status"><div className="toast-icon"><CheckCircle2 size={17} /></div><span>{message}</span><button onClick={onClose} aria-label="Tutup notifikasi"><X size={15} /></button></div>;
}

export default function App() {
  const [logo, setLogo] = useState(() => window.localStorage.getItem('spk-nuansa-wangi-logo-data') || '');
  const [theme, setTheme] = useState(() => window.localStorage.getItem('spk-nuansa-wangi-theme') === 'dark' ? 'dark' : 'light');
  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem('spk-nuansa-wangi-theme', theme); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#081b31' : '#eaf7fb'); }, [theme]);
  const [toast, setToast] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const handleToast = (message) => { setToast(message); window.clearTimeout(window.__spkParfumToastTimer); window.__spkParfumToastTimer = window.setTimeout(() => setToast(''), 3500); };
  const handleSignOut = async () => { try { await logout(); } finally { navigate('/login', { replace: true }); } };
  const protectedDashboard = loading
    ? <main className="auth-loading" aria-live="polite">Memeriksa sesi…</main>
    : user ? <AppShell onToast={handleToast} user={user} onSignOut={handleSignOut} theme={theme} onToggleTheme={toggleTheme} logo={logo} onLogoChange={setLogo} /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <><Routes><Route path="/login" element={loading ? <main className="auth-loading">Memeriksa sesi…</main> : <LoginPage theme={theme} onToggleTheme={toggleTheme} logo={logo} />} /><Route path="/*" element={protectedDashboard} /></Routes><Toast message={toast} onClose={() => setToast('')} /></>;
}


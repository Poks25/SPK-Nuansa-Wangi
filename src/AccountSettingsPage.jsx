import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { apiUrl } from './api.js';

function AccountCard({ account, onUpdated }) {
  const [username, setUsername] = useState(account.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setUsername(account.username), [account.username]);
  const changed = username.trim() !== account.username || password.length > 0;
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (password && password !== confirmPassword) throw new Error('Konfirmasi password baru belum sama.');
      const response = await fetch(apiUrl('/api/auth/accounts/' + account.role), {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...(account.role === 'ADMIN' ? { currentPassword } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Akun gagal diperbarui.');
      await onUpdated(account.role);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  return <section className="panel account-card"><div className="panel-heading"><div className="account-card-title"><span className="account-icon"><UserRound size={17}/></span><div><div className="eyebrow">{account.role === 'ADMIN' ? 'ADMINISTRATOR' : 'PIMPINAN'}</div><h2>{account.name}</h2></div></div></div>
    <form className="master-form account-form" onSubmit={submit}>
      <label className="form-label">Username<input autoComplete="off" minLength={3} maxLength={60} pattern="[A-Za-z0-9._-]+" required value={username} onChange={(e) => setUsername(e.target.value)}/><small>3–60 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.</small></label>
      {account.role === 'ADMIN' && <label className="form-label">Password Admin saat ini<input type="password" autoComplete="current-password" required={changed} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}/><small>Diperlukan untuk mengubah akun Admin.</small></label>}
      <label className="form-label">Password baru (opsional)<input type="password" autoComplete="new-password" minLength={1} maxLength={1024} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kosongkan jika tidak ingin mengubah"/><small>Boleh pendek, tetapi jangan gunakan password akun lain.</small></label>
      {password && <label className="form-label">Ulangi password baru<input type="password" autoComplete="new-password" required minLength={1} maxLength={1024} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/></label>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="button button--primary" type="submit" disabled={saving || !changed || (account.role === 'ADMIN' && !currentPassword) || (password.length > 0 && password !== confirmPassword)}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
    </form>
  </section>;
}

export default function AccountSettingsPage({ onSignOut, onToast }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(apiUrl('/api/auth/accounts'), { credentials: 'include' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Data akun gagal dimuat.');
      setAccounts(body.data || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const handleUpdated = async (role) => {
    onToast(`Akun ${role === 'ADMIN' ? 'Admin' : 'Pimpinan'} diperbarui. Silakan masuk kembali dengan kredensial baru.`);
    await onSignOut();
  };
  return <main className="page-content">
    <div className="page-heading"><div><div className="page-kicker"><KeyRound size={14}/> PENGATURAN <span>/</span> AKUN</div><h1>Username &amp; password</h1><p>Kelola akun Admin dan Pimpinan langsung dari aplikasi.</p></div></div>
    <div className="demo-notice"><div className="demo-notice__icon"><ShieldCheck size={17}/></div><div><strong>Hanya Admin yang dapat mengubah akun</strong><p>Password baru disimpan sebagai hash. Setelah perubahan, semua sesi akan berakhir dan kamu perlu masuk kembali.</p></div></div>
    {error && <div className="auth-error" role="alert">{error} <button onClick={load}>Coba lagi</button></div>}
    {loading ? <section className="panel master-panel master-empty">Memuat akun…</section> : <div className="account-grid">{accounts.map((account) => <AccountCard key={account.role} account={account} onUpdated={handleUpdated}/>)}</div>}
  </main>;
}

import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth.jsx';
import { Alert } from '../components/Field.jsx';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});

    // Validasi di sisi klien (server tetap memvalidasi ulang)
    const clientErrors = {};
    if (!form.name.trim()) clientErrors.name = 'Nama lengkap wajib diisi.';
    if (form.password.length < 6) clientErrors.password = 'Password minimal 6 karakter.';
    if (form.password !== form.confirmPassword) clientErrors.confirmPassword = 'Konfirmasi password tidak cocok.';
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return setBusy(false); }

    try {
      await register(form); // sukses → sesi aktif → Guest guard langsung mengarahkan ke Beranda
    } catch (err) {
      const hasFieldErrors = err.errors && Object.keys(err.errors).length > 0;
      setError(hasFieldErrors ? '' : err.message);
      setErrors(err.errors || {});
      setBusy(false);
    }
  }

  const inputCls =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

  const FieldError = ({ name }) =>
    errors[name] ? <p role="alert" className="mt-1 text-xs text-red-600">{errors[name]}</p> : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri (hanya tampil di layar lebar) */}
      <aside className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-4">
          <Logo className="h-16 w-16" light />
          <span className="text-3xl font-bold tracking-tight">iC</span>
          <span className="text-xl font-bold tracking-tight">interConnected</span>
        </div>

        <div className="max-w-lg">
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Satu ruang untuk saling berbagi kabar.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            Bagikan status, balas dengan gambar, dan lihat siapa yang sedang membicarakan apa,
            tanpa harus mencari di grup chat.
          </p>
        </div>

        <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} iC interConnected By Fajar Pangestu. All rights reserved.</p>
      </aside>

      {/* Panel kanan: form */}
      <main className="flex items-center justify-center bg-slate-100 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header mobile (latar terang) */}
          <div className="mb-8 flex items-center gap-3 text-slate-900 lg:hidden">
            <Logo className="h-14 w-14" />
            <span className="text-2xl font-bold">iC</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Buat akun</h1>
          <p className="mt-3 text-lg text-slate-500">Daftar dan langsung mulai berbagi moment.</p>

          <form onSubmit={submit} noValidate className="mt-10 space-y-5">
            {error && <Alert>{error}</Alert>}

            <div>
              <label htmlFor="name" className="text-sm font-semibold text-slate-900">Nama lengkap</label>
              <input id="name" type="text" maxLength={100} autoComplete="name" className={inputCls}
                value={form.name} onChange={set('name')} required />
              <FieldError name="name" />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-900">Email</label>
              <input id="email" type="email" autoComplete="email" className={inputCls}
                value={form.email} onChange={set('email')} required />
              <FieldError name="email" />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-slate-900">Password</label>
              <input id="password" type="password" autoComplete="new-password" className={inputCls}
                value={form.password} onChange={set('password')} required />
              {errors.password
                ? <FieldError name="password" />
                : <p className="mt-1 text-xs text-slate-500">Minimal 6 karakter</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-900">Konfirmasi password</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" className={inputCls}
                value={form.confirmPassword} onChange={set('confirmPassword')} required />
              <FieldError name="confirmPassword" />
            </div>

            <button disabled={busy}
              className="w-full rounded-full bg-brand py-3.5 text-base font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Memproses…' : 'Daftar'}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Masuk</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
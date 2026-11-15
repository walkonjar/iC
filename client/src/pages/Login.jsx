import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../auth.jsx';
import { Alert } from '../components/Field.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    try {
      await login(form); // sukses → Guest guard mengarahkan ke Beranda
    } catch (err) {
      setError(err.message); setErrors(err.errors); setBusy(false);
    }
  }

  const inputCls =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri (hanya tampil di layar lebar) */}
      <aside className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        {/* Panel kiri (latar gelap) */}
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

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Masuk</h1>
          <p className="mt-3 text-lg text-slate-500">Wadah Berbagi Moment.</p>

          <form onSubmit={submit} noValidate className="mt-10 space-y-6">
            {state?.warning && !error && <Alert kind="warning">{state.warning}</Alert>}
            {state?.info && !error && <Alert kind="info">{state.info}</Alert>}
            {error && <Alert>{error}</Alert>}

            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-900">Email</label>
              <input id="email" type="email" autoComplete="email" className={inputCls}
                value={form.email} onChange={set('email')} required />
              {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-slate-900">Password</label>
              <input id="password" type="password" autoComplete="current-password" className={inputCls}
                value={form.password} onChange={set('password')} required />
              {errors.password && <p role="alert" className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button disabled={busy}
              className="w-full rounded-full bg-brand py-3.5 text-base font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Daftar</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
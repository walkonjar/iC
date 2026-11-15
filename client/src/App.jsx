import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';

function Splash() {
  return <div className="grid min-h-screen place-items-center text-muted">Memuat…</div>;
}

// Auth guard: belum login → ke /login dengan notifikasi peringatan.
function Protected({ children }) {
  const { user, loading, loggedOut } = useAuth();
  if (loading) return <Splash />;
  if (!user) {
    const state = loggedOut
      ? { info: 'Anda berhasil keluar.' }
      : { warning: 'Silakan login terlebih dahulu untuk mengakses halaman tersebut.' };
    return <Navigate to="/login" replace state={state} />;
  }
  return (<><Navbar /><main className="mx-auto w-full max-w-2xl px-4 py-6">{children}</main></>);
}

// Guest guard: sudah login → dialihkan ke Beranda.
function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Protected><Feed /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

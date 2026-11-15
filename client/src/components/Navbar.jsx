import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../auth.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-brand">iC</Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/5">
            <Avatar src={user.avatar} name={user.name} size={32} />
            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.name}</span>
          </NavLink>
          <button className="btn-ghost" disabled={busy} onClick={() => { setBusy(true); logout(); }}>Keluar</button>
        </nav>
      </div>
    </header>
  );
}

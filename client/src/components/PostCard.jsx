import { useState } from 'react';
import { api, formatTime } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from './Avatar.jsx';
import Comments from './Comments.jsx';

export default function PostCard({ post, onChange, onDelete }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isOwner = post.user_id === user.id;

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    try {
      const d = await api.post(`/api/posts/${post.id}/like`);
      onChange({ ...post, liked: d.liked, like_count: d.like_count });
    } catch { /* abaikan */ }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm('Hapus postingan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try { await api.del(`/api/posts/${post.id}`); onDelete(post.id); } catch (e) { alert(e.message); }
  }

  return (
    <article className="card p-4">
      <header className="flex items-start gap-3">
        <Avatar src={post.author_avatar} name={post.author_name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{post.author_name}</p>
          <time className="text-xs text-muted" dateTime={post.created_at}>{formatTime(post.created_at)}</time>
        </div>
        {isOwner && <button className="btn-ghost text-red-600! hover:bg-red-50!" onClick={remove}>Hapus</button>}
      </header>

      {post.content && <p className="mt-3 whitespace-pre-wrap break-words">{post.content}</p>}
      {post.image && <img src={post.image} alt="Lampiran postingan" loading="lazy" className="mt-3 max-h-120 w-full rounded-xl border border-line object-cover" />}

      <footer className="mt-3 flex items-center gap-1 border-t border-line pt-2 text-sm">
        <button onClick={toggleLike} disabled={busy} aria-pressed={post.liked}
          className={`btn-ghost ${post.liked ? 'font-semibold text-rose-600!' : ''}`}>
          {post.liked ? '♥ Disukai' : '♡ Suka'} · {post.like_count}
        </button>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="btn-ghost">Komentar · {post.comment_count}</button>
      </footer>

      {open && <Comments postId={post.id} onAdded={() => onChange({ ...post, comment_count: post.comment_count + 1 })} />}
    </article>
  );
}

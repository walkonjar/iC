import { useEffect, useState } from 'react';
import { api, formatTime } from '../api.js';
import Avatar from './Avatar.jsx';
import ImagePicker from './ImagePicker.jsx';

export default function Comments({ postId, onAdded }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/posts/${postId}/comments`).then((d) => setItems(d.comments)).catch((e) => setError(e.message));
  }, [postId]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() && !file) return setError('Tulis komentar atau lampirkan gambar.');
    setBusy(true); setError('');
    const fd = new FormData();
    fd.append('comment', text);
    if (file) fd.append('image', file);
    try {
      const d = await api.post(`/api/posts/${postId}/comments`, fd);
      setItems((c) => [...c, d.comment]);
      setText(''); setFile(null); onAdded();
    } catch (err) { setError(err.errors?.comment || err.errors?.image || err.message); }
    setBusy(false);
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      {items === null && !error && <p className="text-sm text-muted">Memuat komentar…</p>}
      {items?.length === 0 && <p className="text-sm text-muted">Belum ada komentar. Jadilah yang pertama.</p>}
      <ul className="space-y-3">
        {items?.map((c) => (
          <li key={c.id} className="flex gap-2">
            <Avatar src={c.author_avatar} name={c.author_name} size={32} />
            <div className="min-w-0 flex-1 rounded-xl bg-canvas px-3 py-2">
              <p className="text-sm"><span className="font-semibold">{c.author_name}</span> <span className="text-xs text-muted">{formatTime(c.created_at)}</span></p>
              {c.comment && <p className="whitespace-pre-wrap break-words text-sm">{c.comment}</p>}
              {c.image && <img src={c.image} alt="Lampiran komentar" loading="lazy" className="mt-2 max-h-48 rounded-lg" />}
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <textarea className="input resize-none" rows={2} maxLength={1000} placeholder="Tulis komentar…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-center justify-between">
          <ImagePicker file={file} onChange={setFile} onError={setError} label="Lampirkan gambar" />
          <button className="btn" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim'}</button>
        </div>
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}

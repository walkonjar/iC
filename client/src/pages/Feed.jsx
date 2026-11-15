import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import ImagePicker from '../components/ImagePicker.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/posts').then((d) => setPosts(d.posts)).catch((e) => setLoadError(e.message));
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!content.trim() && !file) return setError('Tulis sesuatu atau lampirkan gambar.');
    setBusy(true); setError('');
    const fd = new FormData();
    fd.append('content', content);
    if (file) fd.append('image', file);
    try {
      const d = await api.post('/api/posts', fd);
      setPosts((p) => [d.post, ...p]); // posting baru tampil paling atas
      setContent(''); setFile(null);
    } catch (err) { setError(err.errors?.content || err.errors?.image || err.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card p-4">
        <div className="flex gap-3">
          <Avatar src={user.avatar} name={user.name} />
          <textarea className="input resize-none" rows={3} maxLength={2000} placeholder={`Apa yang sedang Anda pikirkan, ${user.name.split(' ')[0]}?`}
            value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="mt-2 flex items-start justify-between gap-2 pl-13">
          <ImagePicker file={file} onChange={setFile} onError={setError} label="Tambah gambar" />
          <button className="btn" disabled={busy}>{busy ? 'Memposting…' : 'Posting'}</button>
        </div>
        {error && <p role="alert" className="mt-2 pl-13 text-xs text-red-600">{error}</p>}
      </form>

      {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
      {posts === null && !loadError && <p className="text-center text-sm text-muted">Memuat beranda…</p>}
      {posts?.length === 0 && <p className="card p-8 text-center text-muted">Beranda masih kosong. Bagikan status pertama Anda di atas.</p>}
      {posts?.map((p) => (
        <PostCard key={p.id} post={p}
          onChange={(np) => setPosts((l) => l.map((x) => (x.id === np.id ? np : x)))}
          onDelete={(id) => setPosts((l) => l.filter((x) => x.id !== id))} />
      ))}
    </div>
  );
}

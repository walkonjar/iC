import { useEffect, useRef, useState } from 'react';

const MAX = 2 * 1024 * 1024;
const OK = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// File gambar dipilih lewat input; preview memakai object URL lokal.
export default function ImagePicker({ file, onChange, onError, label = 'Gambar' }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!OK.includes(f.type)) return onError?.('Gunakan JPG, PNG, WEBP, atau GIF.');
    if (f.size > MAX) return onError?.('Ukuran gambar maksimal 2 MB.');
    onError?.('');
    onChange(f);
  }

  return (
    <div>
      <input ref={ref} type="file" accept={OK.join(',')} className="sr-only" onChange={pick} />
      <button type="button" className="btn-ghost" onClick={() => ref.current.click()}>{file ? 'Ganti gambar' : label}</button>
      {file && <button type="button" className="btn-ghost" onClick={() => onChange(null)}>Hapus</button>}
      {preview && <img src={preview} alt="Pratinjau" className="mt-2 max-h-56 rounded-lg border border-line object-cover" />}
    </div>
  );
}

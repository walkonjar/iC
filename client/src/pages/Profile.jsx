import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import Field, { Alert } from '../components/Field.jsx';
import ImagePicker from '../components/ImagePicker.jsx';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErrors({});
    const fd = new FormData();
    fd.append('name', name); fd.append('bio', bio);
    if (file) fd.append('avatar', file);
    try {
      const d = await api.put('/api/profile', fd);
      setUser(d.user); setFile(null);
      setMsg({ kind: 'info', text: 'Profil berhasil diperbarui.' });
    } catch (err) { setErrors(err.errors); setMsg({ kind: 'error', text: err.message }); }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
      <h2 className="text-lg font-semibold">Ubah profil</h2>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar} name={user.name} size={64} />
        <div>
          <ImagePicker file={file} onChange={setFile} onError={(t) => setErrors({ avatar: t })} label="Pilih foto profil" />
          {errors.avatar && <p role="alert" className="text-xs text-red-600">{errors.avatar}</p>}
        </div>
      </div>
      <Field label="Nama pengguna" error={errors.name}><input className="input" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
      <Field label="Bio" error={errors.bio}><textarea className="input resize-none" rows={3} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
      <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan profil'}</button>
    </form>
  );
}

function PasswordForm() {
  const empty = { oldPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErrors({});
    try {
      await api.put('/api/profile/password', form);
      setForm(empty);
      setMsg({ kind: 'info', text: 'Password berhasil diubah.' });
    } catch (err) { setErrors(err.errors); setMsg({ kind: 'error', text: err.message }); }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
      <h2 className="text-lg font-semibold">Ubah password</h2>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <Field label="Password lama" error={errors.oldPassword}><input className="input" type="password" autoComplete="current-password" value={form.oldPassword} onChange={set('oldPassword')} /></Field>
      <Field label="Password baru" error={errors.newPassword}><input className="input" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} /></Field>
      <Field label="Konfirmasi password baru" error={errors.confirmPassword}><input className="input" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} /></Field>
      <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan password'}</button>
    </form>
  );
}

export default function Profile() {
  return <div className="space-y-4"><ProfileForm /><PasswordForm /></div>;
}

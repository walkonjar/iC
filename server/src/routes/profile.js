import { Router } from 'express';
import argon2 from 'argon2';
import { pool } from '../db.js';
import { HttpError, validate, z, upload, saveImage, removeImage } from '../http.js';

const router = Router();

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(100, 'Nama maksimal 100 karakter.'),
  bio: z.string().trim().max(300, 'Bio maksimal 300 karakter.').optional().default(''),
});

router.put('/', upload('avatar'), async (req, res) => {
  const d = validate(profileSchema, req.body);
  const newAvatar = await saveImage(req.file, 'avatar');
  const avatar = newAvatar ?? req.user.avatar;
  await pool.execute('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?',
    [d.name, d.bio || null, avatar, req.user.id]);
  if (newAvatar) await removeImage(req.user.avatar);
  res.json({ user: { ...req.user, name: d.name, bio: d.bio || null, avatar } });
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Password lama wajib diisi.'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter.').max(128),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Konfirmasi password tidak cocok.' });

router.put('/password', async (req, res) => {
  const d = validate(passwordSchema, req.body);
  const [[row]] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
  if (!(await argon2.verify(row.password, d.oldPassword)))
    throw new HttpError(422, 'Data tidak valid.', { oldPassword: 'Password lama salah.' });
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [await argon2.hash(d.newPassword), req.user.id]);
  // Keluarkan perangkat lain; sesi saat ini tetap aktif.
  await pool.execute('DELETE FROM sessions WHERE user_id = ? AND id <> ?', [req.user.id, req.sessionHash]);
  res.json({ ok: true });
});

export default router;

import { Router } from 'express';
import argon2 from 'argon2';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../db.js';
import { HttpError, validate, z, createSession, destroySession, requireGuest, requireAuth } from '../http.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi.').max(100, 'Nama maksimal 100 karakter.'),
  email: z.email('Format email tidak valid.').max(150).transform((s) => s.toLowerCase()),
  password: z.string().min(6, 'Password minimal 6 karakter.').max(128, 'Password terlalu panjang.'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Konfirmasi password tidak cocok.' });

// Hash tiruan agar waktu respons login tidak membocorkan apakah email terdaftar.
const dummyHash = await argon2.hash('dummy-password');

router.post('/register', limiter, requireGuest, async (req, res) => {
  const d = validate(registerSchema, req.body);
  const [exist] = await pool.execute('SELECT id FROM users WHERE email = ?', [d.email]);
  if (exist.length) throw new HttpError(422, 'Data tidak valid.', { email: 'Email sudah terdaftar.' });

  const hash = await argon2.hash(d.password);
  let id;
  try {
    [{ insertId: id }] = await pool.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [d.name, d.email, hash]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(422, 'Data tidak valid.', { email: 'Email sudah terdaftar.' });
    throw e;
  }
  await createSession(res, id); // auto-login: langsung punya sesi aktif
  res.status(201).json({ user: { id, name: d.name, email: d.email, avatar: null, bio: null } });
});

const loginSchema = z.object({
  email: z.email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

router.post('/login', limiter, requireGuest, async (req, res) => {
  const d = validate(loginSchema, req.body);
  const [rows] = await pool.execute(
    'SELECT id, name, email, avatar, bio, password FROM users WHERE email = ?', [d.email.toLowerCase()]);
  const u = rows[0];
  const ok = await argon2.verify(u?.password ?? dummyHash, d.password);
  if (!u || !ok) throw new HttpError(401, 'Email atau password salah.');
  await createSession(res, u.id);
  const { password, ...user } = u;
  res.json({ user });
});

router.post('/logout', requireAuth, async (req, res) => {
  await destroySession(req, res);
  res.json({ ok: true });
});

// Selalu 200 agar pengecekan sesi di klien tidak memunculkan error di console.
router.get('/me', (req, res) => res.json({ user: req.user }));

export default router;

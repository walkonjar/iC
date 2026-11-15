import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { z } from 'zod';
import { pool } from './db.js';

export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/* ---------- Validasi ---------- */
export function validate(schema, data) {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const errors = {};
  for (const issue of r.error.issues) errors[issue.path[0] ?? '_'] ??= issue.message;
  throw new HttpError(422, 'Data tidak valid.', errors);
}

export const parseId = (v) => {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < 1) throw new HttpError(404, 'Data tidak ditemukan.');
  return n;
};

/* ---------- Sesi & proteksi rute ---------- */
const COOKIE = 'cs_sid';
const SESSION_DAYS = 7;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

export async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await pool.execute(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
    [sha256(token), userId, SESSION_DAYS],
  );
  res.cookie(COOKIE, token, { ...cookieOpts(), maxAge: SESSION_DAYS * 864e5 });
}

export async function destroySession(req, res) {
  if (req.sessionHash) await pool.execute('DELETE FROM sessions WHERE id = ?', [req.sessionHash]);
  res.clearCookie(COOKIE, cookieOpts());
}

export async function loadSession(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[COOKIE];
  if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
    const hash = sha256(token);
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.avatar, u.bio
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > NOW()`,
      [hash],
    );
    if (rows[0]) { req.user = rows[0]; req.sessionHash = hash; }
  }
  next();
}

export const requireAuth = (req, _res, next) =>
  req.user ? next() : next(new HttpError(401, 'Silakan login terlebih dahulu.'));

export const requireGuest = (req, _res, next) =>
  req.user ? next(new HttpError(403, 'Anda sudah login.')) : next();

// Perlindungan CSRF: permintaan yang mengubah data wajib berasal dari origin yang diizinkan.
export function originGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const allowed = process.env.CLIENT_ORIGIN;
  if (req.get('origin') !== allowed) return next(new HttpError(403, 'Origin tidak diizinkan.'));
  next();
}

/* ---------- Upload gambar aman ---------- */
export const UPLOAD_DIR = path.resolve('uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export const upload = (field) => {
  const mw = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 10 } }).single(field);
  return (req, res, next) => mw(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(new HttpError(413, 'Ukuran gambar maksimal 2 MB.', { [field]: 'Ukuran gambar maksimal 2 MB.' }));
    next(new HttpError(400, 'Upload gagal.'));
  });
};

// Tipe file ditentukan dari isi (magic bytes), bukan dari nama/ekstensi/header klien.
export async function saveImage(file, field = 'image') {
  if (!file) return null;
  const type = await fileTypeFromBuffer(file.buffer);
  const ext = type && EXT[type.mime];
  if (!ext) throw new HttpError(415, 'Format gambar tidak didukung.', { [field]: 'Gunakan JPG, PNG, WEBP, atau GIF.' });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer, { flag: 'wx' });
  return `/uploads/${name}`;
}

export async function removeImage(p) {
  if (typeof p === 'string' && p.startsWith('/uploads/'))
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(p))).catch(() => {});
}

export { z };

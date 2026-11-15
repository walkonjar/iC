import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { HttpError, loadSession, requireAuth, originGuard, UPLOAD_DIR } from './http.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import postRoutes from './routes/posts.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/uploads', express.static(UPLOAD_DIR, {
  index: false, dotfiles: 'ignore', maxAge: '7d',
  setHeaders: (res) => res.set('Content-Security-Policy', "default-src 'none'; sandbox"),
}));

app.use('/api', originGuard, loadSession);
app.use('/api/auth', authRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/posts', requireAuth, postRoutes);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan.')));

// Produksi: sajikan hasil build React dari Express.
const dist = path.resolve('../client/dist');
if (isProd && fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, errors: err.errors });
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(400).json({ message: 'Permintaan tidak valid.' });
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));

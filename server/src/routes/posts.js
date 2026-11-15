import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError, validate, parseId, z, upload, saveImage, removeImage } from '../http.js';

const router = Router();

const POST_SQL = `
  SELECT p.id, p.user_id, p.content, p.image, p.created_at, p.updated_at,
         u.name AS author_name, u.avatar AS author_avatar,
         (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
         EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
    FROM posts p JOIN users u ON u.id = p.user_id`;

const shape = (r) => ({ ...r, liked: !!r.liked, like_count: Number(r.like_count), comment_count: Number(r.comment_count) });

async function getPost(id, uid) {
  const [rows] = await pool.execute(`${POST_SQL} WHERE p.id = ?`, [uid, id]);
  return rows[0] ? shape(rows[0]) : null;
}

const mustExist = async (id) => {
  const [r] = await pool.execute('SELECT id, user_id, image FROM posts WHERE id = ?', [id]);
  if (!r[0]) throw new HttpError(404, 'Postingan tidak ditemukan.');
  return r[0];
};

router.get('/', async (req, res) => {
  const [rows] = await pool.execute(`${POST_SQL} ORDER BY p.created_at DESC, p.id DESC LIMIT 100`, [req.user.id]);
  res.json({ posts: rows.map(shape) });
});

const postSchema = z.object({ content: z.string().trim().max(2000, 'Teks maksimal 2000 karakter.').optional().default('') });

router.post('/', upload('image'), async (req, res) => {
  const { content } = validate(postSchema, req.body);
  if (!content && !req.file)
    throw new HttpError(422, 'Data tidak valid.', { content: 'Tulis sesuatu atau lampirkan gambar.' });
  const image = await saveImage(req.file);
  const [r] = await pool.execute('INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)', [req.user.id, content || null, image]);
  res.status(201).json({ post: await getPost(r.insertId, req.user.id) });
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const post = await mustExist(id);
  if (post.user_id !== req.user.id) throw new HttpError(403, 'Anda tidak berhak menghapus postingan ini.');
  const [imgs] = await pool.execute('SELECT image FROM comments WHERE post_id = ? AND image IS NOT NULL', [id]);
  await pool.execute('DELETE FROM posts WHERE id = ? AND user_id = ?', [id, req.user.id]);
  await Promise.all([post.image, ...imgs.map((i) => i.image)].map(removeImage));
  res.json({ ok: true });
});

// Like (toggle): UNIQUE (user_id, post_id) menjamin 1 user = maks. 1 like.
router.post('/:id/like', async (req, res) => {
  const id = parseId(req.params.id);
  await mustExist(id);
  const [ins] = await pool.execute('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, id]);
  if (ins.affectedRows === 0) await pool.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, id]);
  const [[c]] = await pool.execute('SELECT COUNT(*) AS n FROM likes WHERE post_id = ?', [id]);
  res.json({ liked: ins.affectedRows > 0, like_count: Number(c.n) });
});

const COMMENT_SQL = `
  SELECT c.id, c.post_id, c.user_id, c.comment, c.image, c.created_at,
         u.name AS author_name, u.avatar AS author_avatar
    FROM comments c JOIN users u ON u.id = c.user_id`;

router.get('/:id/comments', async (req, res) => {
  const id = parseId(req.params.id);
  await mustExist(id);
  const [rows] = await pool.execute(`${COMMENT_SQL} WHERE c.post_id = ? ORDER BY c.created_at ASC, c.id ASC LIMIT 500`, [id]);
  res.json({ comments: rows });
});

const commentSchema = z.object({ comment: z.string().trim().max(1000, 'Komentar maksimal 1000 karakter.').optional().default('') });

router.post('/:id/comments', upload('image'), async (req, res) => {
  const id = parseId(req.params.id);
  await mustExist(id);
  const { comment } = validate(commentSchema, req.body);
  if (!comment && !req.file)
    throw new HttpError(422, 'Data tidak valid.', { comment: 'Tulis komentar atau lampirkan gambar.' });
  const image = await saveImage(req.file);
  const [r] = await pool.execute('INSERT INTO comments (post_id, user_id, comment, image) VALUES (?, ?, ?, ?)', [id, req.user.id, comment || null, image]);
  const [rows] = await pool.execute(`${COMMENT_SQL} WHERE c.id = ?`, [r.insertId]);
  res.status(201).json({ comment: rows[0] });
});

export default router;

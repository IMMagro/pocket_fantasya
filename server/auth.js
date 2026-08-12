// ─────────────────────────────────────────────────────────────────────────────
// Auth self-hosted: registrazione/login con username+password (bcrypt) e sessione
// via JWT. Più le rotte del profilo (progressi salvati per utente su Postgres/Neon).
// Montato in server/index.js.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-CAMBIAMI-in-produzione';
if (!process.env.JWT_SECRET) {
  console.warn('[AUTH] ⚠️  JWT_SECRET non impostato: uso un segreto di sviluppo. In produzione imposta JWT_SECRET.');
}
const TOKEN_TTL = '30d'; // i colleghi restano loggati un mese

function sign(user) {
  return jwt.sign({ uid: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Middleware: richiede un token valido. Popola req.userId.
export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non autenticato' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.uid;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessione scaduta, rientra' });
  }
}

function validName(u) { return typeof u === 'string' && /^[a-zA-Z0-9_ ]{3,20}$/.test(u.trim()); }
function validPass(p) { return typeof p === 'string' && p.length >= 6 && p.length <= 100; }

// ── Registrazione ──
router.post('/api/auth/register', async (req, res) => {
  const username = (req.body?.username || '').trim();
  const password = req.body?.password || '';
  if (!validName(username)) return res.status(400).json({ error: 'Username: 3-20 caratteri (lettere, numeri, _ e spazio).' });
  if (!validPass(password)) return res.status(400).json({ error: 'Password: almeno 6 caratteri.' });
  try {
    const exists = await pool.query('SELECT 1 FROM users WHERE lower(username) = lower($1)', [username]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Username già in uso, scegline un altro.' });

    const hash = bcrypt.hashSync(password, 10);
    const ins = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    const user = ins.rows[0];
    const initialProfile = { pocket_fantasya_player_gold_v1: '1000' };
    await pool.query('INSERT INTO profiles (user_id, data) VALUES ($1, $2::jsonb)', [user.id, JSON.stringify(initialProfile)]);
    res.json({ token: sign(user), user, profile: initialProfile });
  } catch (err) {
    // corsa alla registrazione con lo stesso nome → violazione unique
    if (err?.code === '23505') return res.status(409).json({ error: 'Username già in uso, scegline un altro.' });
    console.error('[AUTH] register error:', err.message);
    res.status(500).json({ error: 'Errore del server, riprova.' });
  }
});

// ── Login ──
router.post('/api/auth/login', async (req, res) => {
  const username = (req.body?.username || '').trim();
  const password = req.body?.password || '';
  try {
    const r = await pool.query('SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1)', [username]);
    const row = r.rows[0];
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Username o password errati.' });
    }
    const user = { id: row.id, username: row.username };
    const p = await pool.query('SELECT data FROM profiles WHERE user_id = $1', [row.id]);
    res.json({ token: sign(user), user, profile: p.rows[0]?.data || {} });
  } catch (err) {
    console.error('[AUTH] login error:', err.message);
    res.status(500).json({ error: 'Errore del server, riprova.' });
  }
});

// ── Chi sono (ricarica sessione da token) ──
router.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const u = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.userId]);
    if (u.rowCount === 0) return res.status(404).json({ error: 'Utente non trovato' });
    const p = await pool.query('SELECT data FROM profiles WHERE user_id = $1', [req.userId]);
    res.json({ user: u.rows[0], profile: p.rows[0]?.data || {} });
  } catch (err) {
    console.error('[AUTH] me error:', err.message);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ── Profilo: leggi progressi ──
router.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const p = await pool.query('SELECT data FROM profiles WHERE user_id = $1', [req.userId]);
    res.json(p.rows[0]?.data || {});
  } catch (err) {
    console.error('[AUTH] get profile error:', err.message);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ── Profilo: salva progressi (monete, carte, mazzi, campagna) ──
router.put('/api/profile', requireAuth, async (req, res) => {
  const data = req.body?.data;
  if (typeof data !== 'object' || data === null) return res.status(400).json({ error: 'Dati profilo non validi' });
  try {
    await pool.query(
      `INSERT INTO profiles (user_id, data, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [req.userId, JSON.stringify(data)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[AUTH] put profile error:', err.message);
    res.status(500).json({ error: 'Errore del server' });
  }
});

export default router;

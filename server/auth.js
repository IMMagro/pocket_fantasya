// ─────────────────────────────────────────────────────────────────────────────
// Auth self-hosted: registrazione/login con username+password (bcrypt) e sessione
// via JWT. Più le rotte del profilo (progressi salvati per utente sul server).
// Montato in server/index.js. Nessuna dipendenza esterna: tutto sulla VM.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-CAMBIAMI-in-produzione';
if (!process.env.JWT_SECRET) {
  console.warn('[AUTH] ⚠️  JWT_SECRET non impostato: uso un segreto di sviluppo. Sulla VM imposta JWT_SECRET.');
}
const TOKEN_TTL = '30d'; // i colleghi restano loggati un mese

// ── Statement preparati ──
const qUserByName = db.prepare('SELECT * FROM users WHERE username = ?');
const qUserById   = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
const qInsertUser = db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)');
const qInsertProfile = db.prepare('INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, ?)');
const qProfile    = db.prepare('SELECT data FROM profiles WHERE user_id = ?');
const qUpsertProfile = db.prepare(`
  INSERT INTO profiles (user_id, data, updated_at) VALUES (@uid, @data, @now)
  ON CONFLICT(user_id) DO UPDATE SET data = @data, updated_at = @now
`);

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
router.post('/api/auth/register', (req, res) => {
  const username = (req.body?.username || '').trim();
  const password = req.body?.password || '';
  if (!validName(username)) return res.status(400).json({ error: 'Username: 3-20 caratteri (lettere, numeri, _ e spazio).' });
  if (!validPass(password)) return res.status(400).json({ error: 'Password: almeno 6 caratteri.' });
  if (qUserByName.get(username)) return res.status(409).json({ error: 'Username già in uso, scegline un altro.' });

  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(password, 10);
  const info = qInsertUser.run(username, hash, now);
  qInsertProfile.run(info.lastInsertRowid, '{}', now);
  const user = { id: info.lastInsertRowid, username };
  res.json({ token: sign(user), user, profile: {} });
});

// ── Login ──
router.post('/api/auth/login', (req, res) => {
  const username = (req.body?.username || '').trim();
  const password = req.body?.password || '';
  const row = qUserByName.get(username);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Username o password errati.' });
  }
  const user = { id: row.id, username: row.username };
  const p = qProfile.get(row.id);
  res.json({ token: sign(user), user, profile: p ? JSON.parse(p.data || '{}') : {} });
});

// ── Chi sono (ricarica sessione da token) ──
router.get('/api/auth/me', requireAuth, (req, res) => {
  const user = qUserById.get(req.userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });
  const p = qProfile.get(req.userId);
  res.json({ user: { id: user.id, username: user.username }, profile: p ? JSON.parse(p.data || '{}') : {} });
});

// ── Profilo: leggi progressi ──
router.get('/api/profile', requireAuth, (req, res) => {
  const p = qProfile.get(req.userId);
  res.json(p ? JSON.parse(p.data || '{}') : {});
});

// ── Profilo: salva progressi (monete, carte, mazzi, campagna) ──
router.put('/api/profile', requireAuth, (req, res) => {
  const data = req.body?.data;
  if (typeof data !== 'object' || data === null) return res.status(400).json({ error: 'Dati profilo non validi' });
  qUpsertProfile.run({ uid: req.userId, data: JSON.stringify(data), now: new Date().toISOString() });
  res.json({ ok: true });
});

export default router;

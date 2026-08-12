// ─────────────────────────────────────────────────────────────────────────────
// Database SQLite self-hosted (gira sulla VM Oracle, un file locale).
// Tiene utenti (login) e profili (progressi: monete, carte, mazzi, campagna).
// Un file solo, zero server esterni — 100% sulla nostra macchina.
// ─────────────────────────────────────────────────────────────────────────────
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'cardclash.db');
export const db = new Database(DB_PATH);

// WAL = letture/scritture concorrenti più fluide (più giocatori insieme).
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS profiles (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
  );
`);

console.log('[DB] SQLite pronto ->', DB_PATH);

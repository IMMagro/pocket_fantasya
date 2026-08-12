// ─────────────────────────────────────────────────────────────────────────────
// Database Postgres (Neon, piano gratuito). Tiene utenti (login) e profili
// (progressi: monete, carte, mazzi, campagna). Connessione via DATABASE_URL.
// Su Render/Neon la connessione è cifrata (SSL).
// ─────────────────────────────────────────────────────────────────────────────
import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL || ''

if (!connectionString) {
  console.warn('[DB] ⚠️  DATABASE_URL non impostato: il login/i profili non funzioneranno finché non lo configuri (Neon).')
}

// Neon e i provider cloud richiedono SSL; in locale (se mai) niente SSL.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString)
export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: connectionString && !isLocal ? { rejectUnauthorized: false } : false,
  max: 5, // Neon free: poche connessioni, teniamo il pool piccolo
})

// Crea le tabelle se non esistono (username unico case-insensitive via indice su lower()).
export async function initDb() {
  if (!connectionString) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username));
    CREATE TABLE IF NOT EXISTS profiles (
      user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data       JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  console.log('[DB] Postgres pronto (tabelle users + profiles).')
}

// ─────────────────────────────────────────────────────────────────────────────
// Client auth (frontend): parla col backend self-hosted (/api/auth/*).
// Il token JWT vive in localStorage; l'URL base è quello dell'hub (online = la
// nostra stessa origine, in dev = localhost:4000).
// ─────────────────────────────────────────────────────────────────────────────
import { getHubUrl } from './serverConfig'

const TOKEN_KEY = 'cardclash_token'

export interface AuthUser { id: number; username: string }
export interface AuthResult { token: string; user: AuthUser; profile: Record<string, any> }

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
function setToken(t: string) { try { localStorage.setItem(TOKEN_KEY, t) } catch {} }
export function clearToken() { try { localStorage.removeItem(TOKEN_KEY) } catch {} }

export function authHeader(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: 'Bearer ' + t } : {}
}

async function postJson(path: string, body: any) {
  const r = await fetch(getHubUrl() + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.error || 'Errore di connessione al server')
  return data
}

export async function register(username: string, password: string): Promise<AuthResult> {
  const d = await postJson('/api/auth/register', { username, password })
  setToken(d.token)
  return d
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const d = await postJson('/api/auth/login', { username, password })
  setToken(d.token)
  return d
}

// Ripristina la sessione da un token salvato (all'avvio). null se scaduto/assente.
export async function fetchMe(): Promise<{ user: AuthUser; profile: Record<string, any> } | null> {
  const t = getToken()
  if (!t) return null
  try {
    const r = await fetch(getHubUrl() + '/api/auth/me', { headers: { Authorization: 'Bearer ' + t } })
    if (!r.ok) { clearToken(); return null }
    return await r.json()
  } catch {
    return null // server irraggiungibile: non buttiamo il token, riprova al prossimo avvio
  }
}

export function logout() { clearToken() }

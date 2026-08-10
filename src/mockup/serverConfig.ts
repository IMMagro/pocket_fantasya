// ─────────────────────────────────────────────────────────────────────────────
// Config dell'indirizzo dell'HUB (il PC che ospita server carte + LAN, porta 4000).
//   • Sul PC dell'autore (Massimiliano): resta "localhost".
//   • Sui client dei colleghi (.exe): diventa l'IP del PC dell'autore,
//     inserito al primo avvio e ricordato.
// Un unico punto di verità: tutte le connessioni all'hub passano da getHubUrl().
// ─────────────────────────────────────────────────────────────────────────────

const HUB_KEY = 'pf_hub_url'
export const DEFAULT_HUB_URL = 'http://localhost:4000'

// True SOLO quando il gioco gira dentro l'eseguibile client dei colleghi.
// Il preload di Electron imposta window.__PF_HUB_CLIENT__ = true (vedi Fase 2).
// Nel browser dell'autore resta false → nessuna schermata di setup.
export const IS_PACKAGED_CLIENT =
  typeof window !== 'undefined' && (window as any).__PF_HUB_CLIENT__ === true

// Normalizza qualsiasi input ("192.168.1.45", "192.168.1.45:4000",
// "http://192.168.1.45:4000/") in una URL valida con porta.
export function normalizeHub(input: string): string {
  let v = (input || '').trim()
  if (!v) return DEFAULT_HUB_URL
  v = v.replace(/^https?:\/\//i, '') // togli eventuale schema
  v = v.replace(/\/+$/, '')          // togli slash finali
  if (!/:\d+$/.test(v)) v = v + ':4000' // aggiungi porta se manca
  return 'http://' + v
}

export function getHubUrl(): string {
  try {
    const saved = localStorage.getItem(HUB_KEY)
    if (saved) return saved
  } catch {}
  return DEFAULT_HUB_URL
}

export function hasHub(): boolean {
  try {
    return !!localStorage.getItem(HUB_KEY)
  } catch {
    return false
  }
}

// Restituisce solo "ip:porta" (comodo per i default della lobby LAN)
export function getHubHost(): string {
  return getHubUrl().replace(/^https?:\/\//, '')
}

export function setHubUrl(input: string): string {
  const url = normalizeHub(input)
  try {
    localStorage.setItem(HUB_KEY, url)
  } catch {}
  return url
}

export function clearHub(): void {
  try {
    localStorage.removeItem(HUB_KEY)
  } catch {}
}

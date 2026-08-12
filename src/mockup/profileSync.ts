// ─────────────────────────────────────────────────────────────────────────────
// Sincronizzazione profilo ↔ server. I progressi della new UI vivono in alcune
// chiavi localStorage (oro, inventario, livelli, missioni, mazzo). Qui:
//   • applyProfile()  : scarica il profilo dal server nel localStorage (al login)
//   • startProfileSync(): ripubblica al server ad ogni cambio (debounce) + rete di
//                         sicurezza periodica e all'uscita
//   • clearLocalProgress(): pulisce al logout (così l'utente dopo non eredita i dati)
// Non tocca i moduli di stato esistenti: lavora sulle stesse chiavi che loro usano.
// ─────────────────────────────────────────────────────────────────────────────
import { getHubUrl } from './serverConfig'
import { authHeader } from './auth'

// Le chiavi che compongono il profilo di un giocatore (new UI).
const PROGRESS_KEYS = [
  'pocket_fantasya_player_gold_v1',
  'pocket_fantasya_player_inventory_v1',
  'pocket_fantasya_card_levels_v1',
  'pocket_fantasya_missions_v1',
  'card_clash_newui_deck_v1',
]
const EVENT_NAME = 'pocket_fantasya_state_change'

function fireStateChange() {
  try { window.dispatchEvent(new CustomEvent(EVENT_NAME)) } catch {}
}

// Scrive il profilo del server nel localStorage. I valori sono conservati come
// stringhe raw (numero o JSON) esattamente come i moduli di stato li salvano.
export function applyProfile(profile: Record<string, any> | null | undefined) {
  for (const k of PROGRESS_KEYS) {
    try {
      const has = profile && Object.prototype.hasOwnProperty.call(profile, k) && profile[k] != null
      if (has) {
        const v = profile[k]
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
      } else {
        localStorage.removeItem(k) // profilo nuovo/vuoto → si riparte dai default
      }
    } catch {}
  }
  fireStateChange()
}

// Raccoglie i progressi correnti (stringhe raw) da mandare al server.
export function gatherProfile(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of PROGRESS_KEYS) {
    try {
      const raw = localStorage.getItem(k)
      if (raw != null) out[k] = raw
    } catch {}
  }
  return out
}

export function clearLocalProgress() {
  for (const k of PROGRESS_KEYS) { try { localStorage.removeItem(k) } catch {} }
  fireStateChange()
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
let running = false

async function pushNow() {
  try {
    await fetch(getHubUrl() + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ data: gatherProfile() }),
      keepalive: true, // permette il push anche durante beforeunload
    })
  } catch {}
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(pushNow, 1200)
}

// Attiva la sync automatica dopo il login. Ritorna una funzione di stop.
export function startProfileSync(): () => void {
  if (running) return () => {}
  running = true

  const onChange = () => schedulePush()
  window.addEventListener(EVENT_NAME, onChange)   // oro/inventario/livelli/missioni
  window.addEventListener('storage', onChange)    // cambi da altre schede
  const interval = setInterval(pushNow, 20000)    // rete di sicurezza (copre il mazzo)
  const onHide = () => { if (document.visibilityState === 'hidden') pushNow() }
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('beforeunload', pushNow)

  return () => {
    running = false
    window.removeEventListener(EVENT_NAME, onChange)
    window.removeEventListener('storage', onChange)
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('beforeunload', pushNow)
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null }
  }
}

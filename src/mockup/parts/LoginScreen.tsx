import { useState } from 'react'
import { Icon } from '../NewUI'
import { login, register, type AuthResult } from '../auth'

// Schermata iniziale: i colleghi accedono col proprio profilo (o si registrano).
// Al successo passa il risultato (utente + profilo) al chiamante, che idrata i dati.
export function LoginScreen({ onAuthed }: { onAuthed: (res: AuthResult) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    const u = username.trim()
    if (!u || !password) { setError('Inserisci nome e password.'); return }
    setBusy(true)
    try {
      const res = mode === 'login' ? await login(u, password) : await register(u, password)
      onAuthed(res)
    } catch (e: any) {
      setError(e?.message || 'Qualcosa è andato storto.')
    } finally {
      setBusy(false)
    }
  }

  const input = (props: any) => (
    <input
      {...props}
      style={{ width: '100%', padding: '13px 15px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 10, color: '#e8dcc8', fontSize: 15, outline: 'none', letterSpacing: '0.02em', boxSizing: 'border-box' }}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#06080f', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden' }}>
      {/* Sfondo coerente con la Home */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,15,5,0.9) 0%, #06080f 70%)' }} />
        <div className="glow-orb" style={{ position: 'absolute', left: '-10%', top: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(180,80,10,0.22) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="glow-orb" style={{ position: 'absolute', right: '-8%', top: '30%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(90,40,150,0.18) 0%, transparent 70%)', borderRadius: '50%', animationDelay: '2s' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 2, width: 400, maxWidth: '100%', background: 'linear-gradient(160deg, rgba(18,14,8,0.98), rgba(8,8,14,0.99))', border: '1px solid rgba(240,165,0,0.22)', borderRadius: 20, padding: '34px 30px', boxShadow: '0 30px 90px rgba(0,0,0,0.8)', animation: 'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #f0a500, #c8860a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(240,165,0,0.4)', marginBottom: 14 }}>
            <Icon.sword style={{ width: 26, height: 26, color: '#06080f' }} />
          </div>
          <div className="font-cinzel" style={{ fontSize: 22, fontWeight: 900, color: '#f0a500', letterSpacing: '0.1em' }}>CARD CLASH</div>
          <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.45)', letterSpacing: '0.06em', marginTop: 6 }}>
            {mode === 'login' ? 'Accedi col tuo profilo per giocare' : 'Crea il tuo profilo e inizia a giocare'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {input({ value: username, onChange: (e: any) => { setUsername(e.target.value); setError(null) }, placeholder: 'Nome giocatore', autoFocus: true, maxLength: 20, onKeyDown: (e: any) => { if (e.key === 'Enter') submit() } })}
          {input({ value: password, onChange: (e: any) => { setPassword(e.target.value); setError(null) }, placeholder: 'Password', type: 'password', maxLength: 100, onKeyDown: (e: any) => { if (e.key === 'Enter') submit() } })}
        </div>

        {error && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>✗ {error}</div>
        )}

        <button onClick={submit} disabled={busy} className="btn-primary font-cinzel"
          style={{ width: '100%', marginTop: 20, padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy ? 'Attendi…' : mode === 'login' ? 'Entra' : 'Registrati e gioca'}
        </button>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: 'rgba(232,220,200,0.5)' }}>
          {mode === 'login' ? 'Non hai un profilo? ' : 'Hai già un profilo? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            style={{ background: 'none', border: 'none', color: '#f0a500', cursor: 'pointer', fontSize: 12, fontFamily: 'Cinzel, serif', letterSpacing: '0.04em', padding: 0 }}>
            {mode === 'login' ? 'Registrati' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  )
}

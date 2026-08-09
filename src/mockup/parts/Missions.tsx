import { Icon } from '../NewUI'
import { MISSIONS } from '../campaign'
import { usePlayerMissions } from '../questState'

// Pagina Campagna: elenco delle 10 missioni con stato bloccata/sbloccata/completata.
export function Missions({ onPlay }: { onPlay: (id: number) => void }) {
  const { isCompleted, isUnlocked } = usePlayerMissions()
  const done = MISSIONS.filter(m => isCompleted(m.id)).length
  const pct = Math.round((done / MISSIONS.length) * 100)

  return (
    <div style={{ height: 'calc(100vh - 64px)', overflowY: 'auto', background: '#06080f', padding: '32px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="font-cinzel" style={{ fontSize: 10, letterSpacing: '0.4em', color: 'rgba(240,165,0,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>Campagna</div>
          <h2 className="font-cinzel-deco" style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg,#f87171,#f0a500 45%,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Gli Elettronici</h2>
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(232,220,200,0.5)' }}>10 sfide a difficoltà crescente · l'ultima assegna una carta speciale</div>
          <div style={{ maxWidth: 360, margin: '16px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(232,220,200,0.6)', marginBottom: 5 }}>
              <span>Progresso</span><span>{done}/{MISSIONS.length}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: 'linear-gradient(90deg,#f0a500,#d4842a)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MISSIONS.map(m => {
            const completed = isCompleted(m.id)
            const unlocked = isUnlocked(m.id)
            const accent = m.final ? '#f0a500' : completed ? '#4ade80' : unlocked ? '#60a5fa' : '#4b5563'
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 14,
                background: 'rgba(13,17,32,0.75)', border: `1px solid ${accent}33`, opacity: unlocked ? 1 : 0.55,
              }}>
                <div className="font-cinzel-deco" style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: accent, background: `${accent}18`, border: `1px solid ${accent}55` }}>
                  {completed ? '✓' : unlocked ? m.id : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: '#e8dcc8', letterSpacing: '0.03em' }}>
                    Missione {m.id} — {m.name}{m.final && <span style={{ color: '#f0a500', marginLeft: 8, fontSize: 11 }}>★ FINALE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.5)', marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>
                  <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', marginTop: 4 }}>
                    Avversario: <span style={{ color: '#f87171' }}>{m.aiName}</span> · {m.aiHp} HP · Premio: {m.reward} 🪙{m.final ? ' + carta speciale ✦' : ''}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {completed ? (
                    <button onClick={() => onPlay(m.id)} className="font-cinzel" style={{ padding: '9px 18px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Rigioca</button>
                  ) : unlocked ? (
                    <button onClick={() => onPlay(m.id)} className="btn-primary font-cinzel" style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon.sword style={{ width: 12, height: 12 }} /> Gioca
                    </button>
                  ) : (
                    <span style={{ fontSize: 10, color: 'rgba(232,220,200,0.35)', fontFamily: 'Cinzel,serif' }}>Bloccata</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

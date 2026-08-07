import { useState, useEffect, useMemo } from 'react'
import { Icon } from '../NewUI'
import { useRealCards, RealCardTile, RealBigCard, REAL_RARITY, rarInfo } from '../realCards'

const RARITY_ORDER: Record<string, number> = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 }
const RARITIES = ['mythic', 'legendary', 'epic', 'rare', 'common']

function DetailModal({ card, onClose }: any) {
  const rar = rarInfo(card.rarity)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', animation: 'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <RealBigCard card={card} />
        <div style={{ width: 280, background: 'rgba(10,13,22,0.95)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: 20, padding: '24px 22px' }}>
          <div className="font-cinzel" style={{ fontSize: 16, fontWeight: 700, color: card.accentColor || rar.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{card.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', marginBottom: 18 }}>{card.type}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, white, ${rar.color})`, boxShadow: `0 0 10px ${rar.color}` }} />
            <div className="font-cinzel" style={{ fontSize: 11, color: rar.color, letterSpacing: '0.08em' }}>{rar.label}</div>
          </div>
          {card.type === 'CREATURA' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[{ l: 'ATK', v: card.atk, c: '#f87171', I: Icon.sword }, { l: 'HP', v: card.hp, c: '#4ade80', I: Icon.shield }, { l: 'Mana', v: card.cost, c: '#60a5fa', I: Icon.droplet }].map(s => (
                <div key={s.l} style={{ flex: 1, padding: '10px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, textAlign: 'center' }}>
                  <s.I style={{ width: 14, height: 14, color: s.c, margin: '0 auto 4px', display: 'block' }} />
                  <div className="font-cinzel" style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.06em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${(card.accentColor || '#f0a500')}22`, borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: card.accentColor || '#f0a500', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{card.abilityTitle || 'Abilità'}</div>
            <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.75)', lineHeight: 1.6 }}>{card.abilityText || 'Nessuna abilità.'}</div>
          </div>
          {card.flavorText && <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>"{card.flavorText}"</div>}
          <button onClick={onClose} className="font-cinzel" style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(232,220,200,0.6)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}

export function RealCollection() {
  const { cards, loaded } = useRealCards()
  const [search, setSearch] = useState('')
  const [fRarity, setFRarity] = useState<string>('tutte')
  const [fType, setFType] = useState<string>('tutti')
  const [sortBy, setSortBy] = useState<'rarity' | 'cost' | 'name'>('rarity')
  const [sel, setSel] = useState<any>(null)

  const filtered = useMemo(() => {
    let list = [...cards]
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.abilityText || '').toLowerCase().includes(search.toLowerCase()))
    if (fRarity !== 'tutte') list = list.filter(c => c.rarity === fRarity)
    if (fType !== 'tutti') list = list.filter(c => c.type === fType)
    list.sort((a, b) => sortBy === 'rarity' ? (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9) : sortBy === 'cost' ? a.cost - b.cost : a.name.localeCompare(b.name))
    return list
  }, [cards, search, fRarity, fType, sortBy])

  const byRarity = RARITIES.map(r => ({ r, n: cards.filter(c => c.rarity === r).length })).filter(x => x.n > 0)
  const types = Array.from(new Set(cards.map(c => c.type)))

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'grid', gridTemplateColumns: '260px 1fr', overflow: 'hidden', background: '#06080f' }}>
      {sel && <DetailModal card={sel} onClose={() => setSel(null)} />}

      {/* Sidebar */}
      <div style={{ borderRight: '1px solid rgba(240,165,0,0.08)', overflowY: 'auto', background: 'rgba(6,8,15,0.9)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ padding: '18px 16px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 14 }}>
          <div className="font-cinzel" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,220,200,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Le Tue Carte</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div className="font-cinzel" style={{ fontSize: 32, fontWeight: 700, color: '#f0a500', lineHeight: 1 }}>{cards.length}</div>
            <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.4)' }}>carte create</div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', marginTop: 8, lineHeight: 1.5 }}>Sincronizzate dal Card Creator Studio.</div>
        </div>
        {byRarity.length > 0 && (
          <div>
            <div className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Per Rarità</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byRarity.map(({ r, n }) => {
                const meta = rarInfo(r)
                return (
                  <div key={r} onClick={() => setFRarity(fRarity === r ? 'tutte' : r)}
                    style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: fRarity === r ? `${meta.color}14` : 'rgba(13,17,32,0.6)', border: `1px solid ${fRarity === r ? meta.color + '55' : 'rgba(255,255,255,0.05)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                      <div style={{ fontSize: 10, color: meta.color, fontFamily: 'Cinzel,serif' }}>{meta.label.replace(/^[^A-Za-z]+/, '')}</div>
                    </div>
                    <div className="font-cinzel" style={{ fontSize: 11, color: 'rgba(232,220,200,0.7)', fontWeight: 600 }}>{n}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {types.length > 1 && (
          <div>
            <div className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Per Tipo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {types.map(t => (
                <button key={t} onClick={() => setFType(fType === t ? 'tutti' : t)}
                  style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: fType === t ? 'rgba(240,165,0,0.15)' : 'rgba(13,17,32,0.6)', border: `1px solid ${fType === t ? 'rgba(240,165,0,0.4)' : 'rgba(255,255,255,0.06)'}`, fontSize: 9, color: fType === t ? '#f0a500' : 'rgba(232,220,200,0.5)', textTransform: 'capitalize' }}>{String(t).toLowerCase()}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(240,165,0,0.08)', background: 'rgba(6,8,15,0.95)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Icon.search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(232,220,200,0.3)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o abilità..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 8, color: '#e8dcc8', fontSize: 12, outline: 'none' }} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '8px 12px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 8, color: 'rgba(232,220,200,0.7)', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            <option value="rarity">Ordina: Rarità</option>
            <option value="cost">Ordina: Mana</option>
            <option value="name">Ordina: Nome</option>
          </select>
          <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.35)', whiteSpace: 'nowrap' }}>{filtered.length} carte</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignContent: 'flex-start' }}>
          {loaded && cards.length === 0 && (
            <div style={{ width: '100%', padding: '60px 20px', textAlign: 'center', color: 'rgba(232,220,200,0.35)', fontSize: 13, lineHeight: 1.7 }}>
              <Icon.cards style={{ width: 36, height: 36, margin: '0 auto 14px', display: 'block', opacity: 0.3 }} />
              Non hai ancora creato carte.<br />Apri il <strong style={{ color: '#f0a500' }}>Card Creator Studio</strong> e pubblicale: appariranno qui in tempo reale.
            </div>
          )}
          {filtered.map((card, i) => (
            <div key={card.id} style={{ animation: `slide-up 0.4s ease ${Math.min(i, 12) * 0.03}s both` }}>
              <RealCardTile card={card} onClick={() => setSel(card)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

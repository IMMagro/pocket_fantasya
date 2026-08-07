import { useState, useMemo } from 'react'
import { CATALOG, ELEMENT_META, RARITY_META, Icon } from '../NewUI'
import type { Card, Rarity, CardType } from '../NewUI'

function CatalogCard({ card, count, onAdd }: {
  card: Card
  count: number
  onAdd: () => void
  onRemove: () => void
}) {
  const [hov, setHov] = useState(false)
  const el = ELEMENT_META[card.element]
  const rar = RARITY_META[card.rarity]
  const ElIcon = el.Icon

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 140, height: 200, borderRadius: 12, background: el.bg,
        border: `1.5px solid ${hov ? rar.color + '99' : rar.color + '33'}`,
        boxShadow: hov
          ? `0 0 24px ${el.glow}, 0 16px 40px rgba(0,0,0,0.7)`
          : `0 0 8px ${el.glow}44, 0 8px 24px rgba(0,0,0,0.5)`,
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-4px) scale(1.03)' : 'none',
        flexShrink: 0,
      }}
      onClick={onAdd}
    >
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 55%,rgba(255,255,255,0.03) 100%)', pointerEvents:'none' }} />
      <div className="font-cinzel" style={{
        position:'absolute', top:8, left:8, width:26, height:26, borderRadius:'50%',
        background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:11, fontWeight:700, color:'#fff', boxShadow:'0 0 10px rgba(59,130,246,0.6)', zIndex:2,
      }}>{card.cost}</div>
      <div style={{
        position:'absolute', top:10, right:10, width:8, height:8, borderRadius:'50%',
        background:rar.color, boxShadow:`0 0 6px ${rar.border}`, zIndex:2,
      }} />
      <div style={{
        margin:'10px 10px 0', height:82, borderRadius:8,
        background:`radial-gradient(ellipse at 50% 40%, ${el.color}28 0%, rgba(0,0,0,0.5) 70%)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        border:`1px solid ${el.color}22`, position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 60%, ${el.color}15 0%, transparent 65%)` }} />
        <ElIcon style={{ width:42, height:42, color:el.color, opacity:0.85, position:'relative', zIndex:1 }} />
      </div>
      <div className="font-cinzel" style={{
        padding:'6px 8px 2px', fontSize:9, fontWeight:700, color:el.color,
        letterSpacing:'0.04em', textTransform:'uppercase',
        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      }}>{card.name}</div>
      <div style={{
        margin:'0 8px', padding:'2px 6px', background:'rgba(0,0,0,0.45)', borderRadius:3,
        fontSize:8, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', display:'inline-block',
      }}>{card.type} · {card.element}</div>
      {card.type === 'Creatura' && (
        <div style={{ position:'absolute', bottom:8, left:8, right:8, display:'flex', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'#f87171', fontWeight:600 }}>
            <Icon.sword style={{ width:9, height:9, color:'#f87171' }} />{card.atk}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:9, color:'#4ade80', fontWeight:600 }}>
            <Icon.shield style={{ width:9, height:9, color:'#4ade80' }} />{card.hp}
          </div>
        </div>
      )}
      {count > 0 && (
        <div style={{
          position:'absolute', inset:0, background:'rgba(240,165,0,0.15)',
          border:`1.5px solid #f0a500`, borderRadius:12,
          display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:6, pointerEvents:'none',
        }}>
          <div className="font-cinzel" style={{ background:'#f0a500', color:'#06080f', borderRadius:10, padding:'1px 7px', fontSize:9, fontWeight:700 }}>x{count}</div>
        </div>
      )}
      {hov && count < 2 && (
        <div style={{ position:'absolute', inset:0, background:'rgba(240,165,0,0.08)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(240,165,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon.cross style={{ width:16, height:16, color:'#06080f' }} />
          </div>
        </div>
      )}
    </div>
  )
}

export function DeckBuilder() {
  const [search, setSearch] = useState('')
  const [filterRarity, setFilterRarity] = useState<Rarity | 'tutte'>('tutte')
  const [filterType, setFilterType] = useState<CardType | 'tutti'>('tutti')
  const [filterCost, setFilterCost] = useState<number | null>(null)
  const [deck, setDeck] = useState<Record<string, number>>({ c3: 1, c5: 2, c6: 1 })
  const [deckName, setDeckName] = useState('Mazzo Principale')
  const [hovDeckCard, setHovDeckCard] = useState<string | null>(null)

  const addCard = (id: string) => {
    setDeck(d => {
      const cur = d[id] ?? 0
      if (cur >= 2) return d
      const total = Object.values(d).reduce((a, b) => a + b, 0)
      if (total >= 30) return d
      return { ...d, [id]: cur + 1 }
    })
  }
  const removeCard = (id: string) => {
    setDeck(d => {
      const cur = d[id] ?? 0
      if (cur <= 0) return d
      const next = { ...d, [id]: cur - 1 }
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  const filtered = useMemo(() => CATALOG.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRarity !== 'tutte' && c.rarity !== filterRarity) return false
    if (filterType !== 'tutti' && c.type !== filterType) return false
    if (filterCost !== null) {
      if (filterCost === 7 ? c.cost < 7 : c.cost !== filterCost) return false
    }
    return true
  }), [search, filterRarity, filterType, filterCost])

  const totalCards = Object.values(deck).reduce((a, b) => a + b, 0)
  const deckCards = CATALOG.filter(c => deck[c.id] > 0).sort((a, b) => a.cost - b.cost)

  const curve = Array.from({ length: 8 }, (_, i) => {
    const cost = i < 7 ? i : 7
    return deckCards.filter(c => i < 7 ? c.cost === cost : c.cost >= 7)
                    .reduce((acc, c) => acc + deck[c.id], 0)
  })
  const maxCurve = Math.max(...curve, 1)
  const deckValid = totalCards >= 10

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'1fr 300px', gridTemplateRows:'auto 1fr',
      height:'calc(100vh - 64px)', overflow:'hidden', background:'#06080f',
    }}>
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid rgba(240,165,0,0.08)' }}>
        <div style={{
          padding:'16px 24px', borderBottom:'1px solid rgba(240,165,0,0.08)',
          background:'rgba(6,8,15,0.9)', backdropFilter:'blur(10px)',
          display:'flex', flexDirection:'column', gap:12,
        }}>
          <div>
            <div className="font-cinzel" style={{ fontSize:18, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.06em' }}>Catalogo Carte</div>
            <div style={{ fontSize:11, color:'rgba(232,220,200,0.4)', marginTop:2 }}>
              {CATALOG.length} carte disponibili · clicca per aggiungere al mazzo
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:'1 1 180px', minWidth:160 }}>
              <Icon.search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'rgba(232,220,200,0.3)', pointerEvents:'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca carta..."
                style={{ width:'100%', padding:'8px 10px 8px 32px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:8, color:'#e8dcc8', fontSize:12, outline:'none', fontFamily:'Inter,sans-serif' }} />
            </div>
            <select value={filterRarity} onChange={e => setFilterRarity(e.target.value as Rarity | 'tutte')}
              style={{ padding:'8px 12px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:8, color:'rgba(232,220,200,0.8)', fontSize:11, outline:'none', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
              <option value="tutte">Tutte le rarità</option>
              <option value="leggendaria">★ Leggendaria</option>
              <option value="rara">◆ Rara</option>
              <option value="non comune">● Non Comune</option>
              <option value="comune">· Comune</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value as CardType | 'tutti')}
              style={{ padding:'8px 12px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:8, color:'rgba(232,220,200,0.8)', fontSize:11, outline:'none', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
              <option value="tutti">Tutti i tipi</option>
              <option value="Creatura">Creatura</option>
              <option value="Incantesimo">Incantesimo</option>
              <option value="Artefatto">Artefatto</option>
              <option value="Trappola">Trappola</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'rgba(232,220,200,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', marginRight:4 }}>Mana</span>
            {[null, 0,1,2,3,4,5,6,7].map((cost, i) => (
              <button key={i} onClick={() => setFilterCost(cost === filterCost ? null : cost)} className="font-cinzel"
                style={{
                  width:28, height:28, borderRadius:'50%',
                  border: filterCost === cost && cost !== null ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  background: filterCost === cost && cost !== null ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(13,17,32,0.8)',
                  color: filterCost === cost && cost !== null ? '#fff' : 'rgba(232,220,200,0.6)',
                  fontSize:10, fontWeight:600, cursor:'pointer', transition:'all 0.15s ease',
                }}>
                {cost === null ? '✕' : cost === 7 ? '7+' : cost}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexWrap:'wrap', gap:14, alignContent:'flex-start' }}>
          {filtered.length === 0 && (
            <div style={{ width:'100%', padding:'60px 0', textAlign:'center', color:'rgba(232,220,200,0.3)', fontSize:13 }}>Nessuna carta trovata</div>
          )}
          {filtered.map(card => (
            <CatalogCard key={card.id} card={card} count={deck[card.id] ?? 0} onAdd={() => addCard(card.id)} onRemove={() => removeCard(card.id)} />
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', background:'rgba(8,10,18,0.95)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(240,165,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div className="font-cinzel" style={{ fontSize:11, fontWeight:600, color:'rgba(232,220,200,0.5)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Mazzo Attivo</div>
            {deckValid && (
              <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:10, background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.3)', fontSize:9, color:'#4ade80' }}>
                <Icon.check style={{ width:9, height:9 }} /> Valido
              </div>
            )}
          </div>
          <input value={deckName} onChange={e => setDeckName(e.target.value)} className="font-cinzel"
            style={{ width:'100%', padding:'8px 12px', background:'rgba(13,17,32,0.6)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:8, color:'#f0a500', fontSize:14, fontWeight:700, outline:'none', letterSpacing:'0.04em' }} />
          <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.6)' }}>
              <span style={{ color:'#f0a500', fontWeight:600 }}>{totalCards}</span>
              <span style={{ color:'rgba(232,220,200,0.3)' }}> / 30 carte</span>
            </div>
            <div style={{ fontSize:10, color:'rgba(232,220,200,0.35)' }}>{Object.keys(deck).length} uniche</div>
          </div>
          <div style={{ marginTop:8, height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:2, width:`${(totalCards / 30) * 100}%`,
              background: totalCards >= 30 ? 'linear-gradient(90deg,#f0a500,#d4842a)' : totalCards >= 10 ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#f87171,#ef4444)',
              transition:'width 0.4s ease',
            }} />
          </div>
        </div>

        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(240,165,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div className="font-cinzel" style={{ fontSize:10, fontWeight:600, color:'rgba(232,220,200,0.5)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Curva del Mana</div>
            <div style={{ fontSize:10, color:'rgba(232,220,200,0.3)' }}>
              Media: {totalCards > 0 ? (deckCards.reduce((a,c) => a + c.cost*(deck[c.id]??0), 0) / totalCards).toFixed(1) : '—'}
            </div>
          </div>
          <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:52 }}>
            {curve.map((count, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{
                  width:'100%', height: count > 0 ? `${Math.max((count / maxCurve) * 40, 4)}px` : '2px',
                  borderRadius:'3px 3px 0 0',
                  background: count > 0 ? 'linear-gradient(to top,#3b82f6,#60a5fa)' : 'rgba(255,255,255,0.06)',
                  transition:'height 0.3s ease',
                }} />
                <div style={{ fontSize:8, color:'rgba(232,220,200,0.4)', fontFamily:'Cinzel,serif' }}>{i < 7 ? i : '7+'}</div>
                {count > 0 && <div style={{ fontSize:7, color:'#60a5fa', fontWeight:600 }}>{count}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
          {deckCards.length === 0 && (
            <div style={{ padding:'40px 20px', textAlign:'center', color:'rgba(232,220,200,0.25)', fontSize:12, lineHeight:1.6 }}>
              <Icon.layers style={{ width:28, height:28, margin:'0 auto 12px', display:'block', opacity:0.3 }} />
              Clicca sulle carte del catalogo per aggiungerle al mazzo
            </div>
          )}
          {deckCards.map(card => {
            const el = ELEMENT_META[card.element]
            const rar = RARITY_META[card.rarity]
            const ElIcon = el.Icon
            const isHov = hovDeckCard === card.id
            return (
              <div key={card.id} onMouseEnter={() => setHovDeckCard(card.id)} onMouseLeave={() => setHovDeckCard(null)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8,
                  background: isHov ? 'rgba(240,165,0,0.06)' : 'transparent',
                  border:`1px solid ${isHov ? 'rgba(240,165,0,0.15)' : 'transparent'}`,
                  marginBottom:4, cursor:'pointer', transition:'all 0.15s ease',
                }}>
                <div className="font-cinzel" style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 }}>{card.cost}</div>
                <ElIcon style={{ width:14, height:14, color:el.color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="font-cinzel" style={{ fontSize:10, fontWeight:600, color:'#e8dcc8', letterSpacing:'0.03em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
                  <div style={{ fontSize:8, color:rar.color, marginTop:1, letterSpacing:'0.05em' }}>{rar.label}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <button onClick={() => removeCard(card.id)} style={{ width:18, height:18, borderRadius:'50%', background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', fontSize:14, lineHeight:1, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span className="font-cinzel" style={{ fontSize:11, fontWeight:700, color:'#f0a500', minWidth:14, textAlign:'center' }}>×{deck[card.id]}</span>
                  <button onClick={() => addCard(card.id)} disabled={(deck[card.id] ?? 0) >= 2}
                    style={{ width:18, height:18, borderRadius:'50%', background:(deck[card.id] ?? 0) >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.15)', border:`1px solid ${(deck[card.id] ?? 0) >= 2 ? 'rgba(255,255,255,0.1)' : 'rgba(74,222,128,0.3)'}`, color:(deck[card.id] ?? 0) >= 2 ? 'rgba(255,255,255,0.2)' : '#4ade80', fontSize:14, lineHeight:1, cursor:(deck[card.id] ?? 0) >= 2 ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(240,165,0,0.08)' }}>
          <button className="btn-primary font-cinzel"
            style={{
              width:'100%', padding:'12px', borderRadius:10,
              background: deckValid ? 'linear-gradient(135deg,#f0a500,#d4842a)' : 'rgba(255,255,255,0.06)',
              border:'none', color: deckValid ? '#06080f' : 'rgba(232,220,200,0.3)',
              fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
              cursor: deckValid ? 'pointer' : 'not-allowed',
            }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Icon.check style={{ width:14, height:14 }} />
              {deckValid ? 'Salva & Attiva Mazzo' : `Min. 10 carte (${10 - totalCards} mancanti)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

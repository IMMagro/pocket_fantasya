import { useState, useEffect, useMemo } from 'react'
import { CATALOG, ELEMENT_META, RARITY_META, Icon } from '../NewUI'
import type { Card, Rarity, CardType, Element } from '../NewUI'
import { BigCard } from '../cards'

const OWNED_IDS = new Set(['c1','c2','c3','c5','c6','c8','c9','c10','c12','c15','c16','c18'])
const OWNED_COUNTS: Record<string,number> = { c1:1,c2:3,c3:2,c5:4,c6:1,c8:2,c9:1,c10:3,c12:1,c15:2,c16:1,c18:2 }

function CollectionCardTile({ card, owned, count, onClick }: {
  card: Card; owned: boolean; count: number; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  const el = ELEMENT_META[card.element]
  const rar = RARITY_META[card.rarity]
  const ElIcon = el.Icon
  const isLeg = card.rarity === 'leggendaria'
  const isRare = card.rarity === 'rara'

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 130, height: 186, borderRadius: 12,
        background: owned ? el.bg : 'linear-gradient(160deg,#0c0e14,#12151f)',
        border: `1.5px solid ${owned ? (hov ? rar.color+'cc' : rar.color+'44') : 'rgba(255,255,255,0.06)'}`,
        boxShadow: owned && hov ? `0 0 24px ${el.glow}, 0 16px 40px rgba(0,0,0,0.8)` : owned ? `0 0 8px ${el.glow}44, 0 8px 24px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.4)',
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov && owned ? 'translateY(-5px) scale(1.04)' : 'none',
        filter: owned ? 'none' : 'grayscale(1) brightness(0.35)',
      }}>
      {owned && (isLeg || isRare) && (
        <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none', background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.06) 50%,transparent 60%)', backgroundSize:'200% 200%', animation:'shimmer 3s linear infinite' }} />
      )}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%)', pointerEvents:'none' }} />
      <div className="font-cinzel" style={{ position:'absolute', top:7, left:7, zIndex:5, width:24, height:24, borderRadius:'50%', background: owned ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color: owned ? '#fff' : 'rgba(255,255,255,0.3)', boxShadow: owned ? '0 0 8px rgba(59,130,246,0.6)' : 'none' }}>{card.cost}</div>
      {owned && <div style={{ position:'absolute', top:9, right:9, zIndex:5, width:7, height:7, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, white, ${rar.color})`, boxShadow:`0 0 8px ${rar.color}` }} />}
      <div style={{ margin:'8px 8px 0', height:76, borderRadius:7, background: owned ? `radial-gradient(ellipse at 50% 35%, ${el.color}28 0%, rgba(0,0,0,0.55) 70%)` : 'rgba(0,0,0,0.4)', border:`1px solid ${owned ? el.color+'22' : 'rgba(255,255,255,0.04)'}`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {owned
          ? <><div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 65%, ${el.color}18 0%, transparent 65%)` }} /><ElIcon style={{ width:38, height:38, color:el.color, opacity:0.9, position:'relative', zIndex:1, filter:`drop-shadow(0 0 8px ${el.color})` }} /></>
          : <Icon.gem style={{ width:28, height:28, color:'rgba(255,255,255,0.1)' }} />}
      </div>
      <div className="font-cinzel" style={{ padding:'5px 7px 2px', fontSize:8, fontWeight:700, color: owned ? rar.color : 'rgba(255,255,255,0.2)', letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{owned ? card.name : '???'}</div>
      <div style={{ margin:'0 7px', padding:'2px 5px', background:'rgba(0,0,0,0.4)', borderRadius:3, fontSize:7, color: owned ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)', letterSpacing:'0.06em', textTransform:'uppercase', display:'inline-block' }}>{owned ? `${card.type} · ${card.element}` : '? · ?'}</div>
      {owned && card.type === 'Creatura' && (
        <div style={{ position:'absolute', bottom:22, left:7, right:7, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:8, color:'#f87171', display:'flex', alignItems:'center', gap:2 }}><Icon.sword style={{ width:7, height:7 }} />{card.atk}</span>
          <span style={{ fontSize:8, color:'#4ade80', display:'flex', alignItems:'center', gap:2 }}><Icon.shield style={{ width:7, height:7 }} />{card.hp}</span>
        </div>
      )}
      <div style={{ position:'absolute', bottom:7, left:7, fontSize:6.5, color: owned ? rar.color+'cc' : 'rgba(255,255,255,0.15)', letterSpacing:'0.04em' }}>{owned ? rar.label : '● NON TROVATA'}</div>
      {owned && count > 1 && <div className="font-cinzel" style={{ position:'absolute', bottom:5, right:7, fontSize:8, color:'#f0a500', fontWeight:700 }}>×{count}</div>}
      {hov && owned && <div style={{ position:'absolute', inset:0, borderRadius:12, background:`radial-gradient(ellipse at 50% 0%, ${el.color}18 0%, transparent 60%)`, pointerEvents:'none' }} />}
    </div>
  )
}

function CardDetailModal({ card, count, onClose }: { card: Card; count: number; onClose: () => void }) {
  const el = ELEMENT_META[card.element]
  const rar = RARITY_META[card.rarity]
  const isLeg = card.rarity === 'leggendaria'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.2s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ display:'flex', gap:32, alignItems:'flex-start', animation:'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <BigCard card={card} />
        <div style={{ width:280, background:'rgba(10,13,22,0.95)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:20, padding:'24px 22px', backdropFilter:'blur(20px)' }}>
          <div className="font-cinzel" style={{ fontSize:16, fontWeight:700, color:rar.color, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:4 }}>{card.name}</div>
          <div style={{ fontSize:11, color:'rgba(232,220,200,0.4)', marginBottom:20 }}>{card.type} · {card.element}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%, white, ${rar.color})`, boxShadow:`0 0 10px ${rar.color}` }} />
            <div className="font-cinzel" style={{ fontSize:11, color:rar.color, letterSpacing:'0.08em' }}>{rar.label}</div>
          </div>
          {card.type === 'Creatura' && (
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              {[{ label:'ATK', val:card.atk, color:'#f87171', I:Icon.sword }, { label:'HP', val:card.hp, color:'#4ade80', I:Icon.shield }, { label:'Mana', val:card.cost, color:'#60a5fa', I:Icon.droplet }].map(s => (
                <div key={s.label} style={{ flex:1, padding:'10px 6px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, textAlign:'center' }}>
                  <s.I style={{ width:14, height:14, color:s.color, margin:'0 auto 4px', display:'block' }} />
                  <div className="font-cinzel" style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:8, color:'rgba(232,220,200,0.35)', letterSpacing:'0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:`1px solid ${el.color}18`, borderRadius:10, marginBottom:16 }}>
            <div style={{ fontSize:9, color:el.color, fontFamily:'Cinzel,serif', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Abilità</div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.75)', lineHeight:1.6 }}>{card.ability}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(240,165,0,0.06)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:10, marginBottom:20 }}>
            <div style={{ fontSize:11, color:'rgba(232,220,200,0.55)' }}>Copie possedute</div>
            <div className="font-cinzel" style={{ fontSize:18, fontWeight:700, color:'#f0a500' }}>×{count}</div>
          </div>
          {isLeg && (
            <div style={{ padding:'10px 14px', background:'rgba(255,215,0,0.07)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:10, textAlign:'center', animation:'badge-pulse 2s ease infinite', marginBottom:16 }}>
              <div className="font-cinzel" style={{ fontSize:10, color:'#ffd700', letterSpacing:'0.1em', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Icon.star style={{ width:11, height:11 }} /> Carta Leggendaria <Icon.star style={{ width:11, height:11 }} />
              </div>
            </div>
          )}
          <button onClick={onClose} className="font-cinzel" style={{ width:'100%', padding:'11px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(232,220,200,0.6)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}

export function Collection() {
  const [search, setSearch] = useState('')
  const [filterRarity, setFilterRarity] = useState<Rarity | 'tutte'>('tutte')
  const [filterType, setFilterType] = useState<CardType | 'tutti'>('tutti')
  const [filterElement, setFilterElement] = useState<Element | 'tutti'>('tutti')
  const [showOwned, setShowOwned] = useState<'tutti' | 'possedute' | 'mancanti'>('tutti')
  const [sortBy, setSortBy] = useState<'rarity' | 'cost' | 'name' | 'element'>('rarity')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const rarityOrder: Record<Rarity, number> = { leggendaria:0, rara:1, 'non comune':2, comune:3 }

  const filtered = useMemo(() => {
    let list = [...CATALOG]
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.ability.toLowerCase().includes(search.toLowerCase()))
    if (filterRarity !== 'tutte') list = list.filter(c => c.rarity === filterRarity)
    if (filterType !== 'tutti') list = list.filter(c => c.type === filterType)
    if (filterElement !== 'tutti') list = list.filter(c => c.element === filterElement)
    if (showOwned === 'possedute') list = list.filter(c => OWNED_IDS.has(c.id))
    if (showOwned === 'mancanti') list = list.filter(c => !OWNED_IDS.has(c.id))
    list.sort((a, b) => {
      if (sortBy === 'rarity')   return rarityOrder[a.rarity] - rarityOrder[b.rarity]
      if (sortBy === 'cost')     return a.cost - b.cost
      if (sortBy === 'name')     return a.name.localeCompare(b.name)
      if (sortBy === 'element')  return a.element.localeCompare(b.element)
      return 0
    })
    return list
  }, [search, filterRarity, filterType, filterElement, showOwned, sortBy])

  const totalOwned = OWNED_IDS.size
  const totalCards = CATALOG.length
  const completion = Math.round((totalOwned / totalCards) * 100)

  const byRarity = (['leggendaria','rara','non comune','comune'] as Rarity[]).map(r => ({
    rarity: r,
    owned: CATALOG.filter(c => c.rarity === r && OWNED_IDS.has(c.id)).length,
    total: CATALOG.filter(c => c.rarity === r).length,
    meta: RARITY_META[r],
  }))

  const ELEMENTS_LIST: Element[] = ['fuoco','acqua','natura','oscurità','luce','fulmine','terra']

  return (
    <div style={{ height:'calc(100vh - 64px)', display:'grid', gridTemplateColumns:'260px 1fr', overflow:'hidden', background:'#06080f' }}>
      {selectedCard && OWNED_IDS.has(selectedCard.id) && (
        <CardDetailModal card={selectedCard} count={OWNED_COUNTS[selectedCard.id] ?? 1} onClose={() => setSelectedCard(null)} />
      )}
      <div style={{ borderRight:'1px solid rgba(240,165,0,0.08)', overflowY:'auto', background:'rgba(6,8,15,0.9)', padding:'20px 16px', display:'flex', flexDirection:'column', gap:20 }}>
        <div style={{ padding:'18px 16px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.12)', borderRadius:14 }}>
          <div className="font-cinzel" style={{ fontSize:11, fontWeight:700, color:'rgba(232,220,200,0.6)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Collezione</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:10 }}>
            <div className="font-cinzel" style={{ fontSize:32, fontWeight:700, color:'#f0a500', lineHeight:1 }}>{totalOwned}</div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.4)' }}>/ {totalCards} carte</div>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', borderRadius:3, width:`${completion}%`, background:`linear-gradient(90deg, #f0a500, #ffd166)`, boxShadow:'0 0 8px rgba(240,165,0,0.5)', transition:'width 1s ease' }} />
          </div>
          <div style={{ fontSize:11, color:'rgba(232,220,200,0.4)' }}>{completion}% completato</div>
        </div>
        <div>
          <div className="font-cinzel" style={{ fontSize:10, fontWeight:600, color:'rgba(232,220,200,0.35)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Per Rarità</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {byRarity.map(r => (
              <div key={r.rarity} onClick={() => setFilterRarity(filterRarity === r.rarity ? 'tutte' : r.rarity)}
                style={{ padding:'10px 12px', borderRadius:10, cursor:'pointer', background: filterRarity === r.rarity ? `${r.meta.color}14` : 'rgba(13,17,32,0.6)', border:`1px solid ${filterRarity === r.rarity ? r.meta.color+'55' : 'rgba(255,255,255,0.05)'}`, transition:'all 0.2s ease' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:r.meta.color, boxShadow:`0 0 6px ${r.meta.color}` }} />
                    <div style={{ fontSize:10, color:r.meta.color, fontFamily:'Cinzel,serif', letterSpacing:'0.04em' }}>{r.rarity.charAt(0).toUpperCase() + r.rarity.slice(1)}</div>
                  </div>
                  <div className="font-cinzel" style={{ fontSize:11, color:'rgba(232,220,200,0.7)', fontWeight:600 }}>{r.owned}<span style={{ color:'rgba(232,220,200,0.3)' }}>/{r.total}</span></div>
                </div>
                <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:2, width: r.total > 0 ? `${(r.owned/r.total)*100}%` : '0%', background:`linear-gradient(90deg, ${r.meta.color}, ${r.meta.color}aa)`, transition:'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="font-cinzel" style={{ fontSize:10, fontWeight:600, color:'rgba(232,220,200,0.35)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Per Elemento</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {ELEMENTS_LIST.map(elm => {
              const meta = ELEMENT_META[elm]
              const ElIcon = meta.Icon
              const sel = filterElement === elm
              return (
                <button key={elm} onClick={() => setFilterElement(sel ? 'tutti' : elm)}
                  style={{ padding:'6px 10px', borderRadius:8, cursor:'pointer', background: sel ? `${meta.color}20` : 'rgba(13,17,32,0.6)', border:`1px solid ${sel ? meta.color+'66' : 'rgba(255,255,255,0.06)'}`, display:'flex', alignItems:'center', gap:5, transition:'all 0.15s ease' }}>
                  <ElIcon style={{ width:11, height:11, color: sel ? meta.color : 'rgba(232,220,200,0.35)' }} />
                  <span style={{ fontSize:9, color: sel ? meta.color : 'rgba(232,220,200,0.4)', textTransform:'capitalize' }}>{elm}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <div className="font-cinzel" style={{ fontSize:10, fontWeight:600, color:'rgba(232,220,200,0.35)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Mostra</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {([['tutti','Tutte le carte'],['possedute','Solo possedute'],['mancanti','Carte mancanti']] as [typeof showOwned, string][]).map(([val,label]) => (
              <button key={val} onClick={() => setShowOwned(val)}
                style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', textAlign:'left', background: showOwned === val ? 'rgba(240,165,0,0.1)' : 'transparent', border:`1px solid ${showOwned === val ? 'rgba(240,165,0,0.3)' : 'transparent'}`, color: showOwned === val ? '#f0a500' : 'rgba(232,220,200,0.45)', fontSize:11, transition:'all 0.15s ease', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background: showOwned === val ? '#f0a500' : 'rgba(255,255,255,0.15)', boxShadow: showOwned === val ? '0 0 6px rgba(240,165,0,0.6)' : 'none', flexShrink:0 }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(240,165,0,0.08)', background:'rgba(6,8,15,0.95)', backdropFilter:'blur(10px)', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:160 }}>
            <Icon.search style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:'rgba(232,220,200,0.3)', pointerEvents:'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o abilità..."
              style={{ width:'100%', padding:'8px 10px 8px 30px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.12)', borderRadius:8, color:'#e8dcc8', fontSize:12, outline:'none' }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as CardType|'tutti')} style={{ padding:'8px 12px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.12)', borderRadius:8, color:'rgba(232,220,200,0.7)', fontSize:11, outline:'none', cursor:'pointer' }}>
            <option value="tutti">Tutti i tipi</option>
            <option value="Creatura">Creatura</option>
            <option value="Incantesimo">Incantesimo</option>
            <option value="Artefatto">Artefatto</option>
            <option value="Trappola">Trappola</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ padding:'8px 12px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.12)', borderRadius:8, color:'rgba(232,220,200,0.7)', fontSize:11, outline:'none', cursor:'pointer' }}>
            <option value="rarity">Ordina: Rarità</option>
            <option value="cost">Ordina: Mana</option>
            <option value="name">Ordina: Nome</option>
            <option value="element">Ordina: Elemento</option>
          </select>
          <div style={{ fontSize:11, color:'rgba(232,220,200,0.35)', whiteSpace:'nowrap' }}>{filtered.length} carte</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexWrap:'wrap', gap:14, alignContent:'flex-start' }}>
          {filtered.length === 0 && (
            <div style={{ width:'100%', padding:'60px 0', textAlign:'center', color:'rgba(232,220,200,0.25)', fontSize:13 }}>
              <Icon.search style={{ width:28, height:28, margin:'0 auto 12px', display:'block', opacity:0.3 }} />
              Nessuna carta trovata
            </div>
          )}
          {filtered.map((card, i) => (
            <div key={card.id} style={{ animation:`slide-up 0.4s ease ${Math.min(i,12)*0.03}s both` }}>
              <CollectionCardTile card={card} owned={OWNED_IDS.has(card.id)} count={OWNED_COUNTS[card.id] ?? 0} onClick={() => setSelectedCard(card)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

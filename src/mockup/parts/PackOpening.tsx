import { useState, useEffect, useRef, useMemo } from 'react'
import { Icon } from '../NewUI'
import { useRealCards, RealBigCard, RealCardTile, rarInfo, REAL_RARITY } from '../realCards'
import { usePlayerEconomy, usePlayerInventory } from '../playerState'
import { soundEngine } from '../../engine/soundEngine'

type PackPhase = 'select' | 'tear' | 'burst' | 'cards' | 'done'

interface PackType {
  id: string
  name: string
  edition: string
  count: number
  cost: number
  colorA: string
  colorB: string
  accent: string
  tag: string
  photo: string
  guaranteedRank: number
}

// Ordine di rarità reale (basso → alto), coerente con lo Studio / TactileCard
const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 }
// Pesi di drop: comuni frequenti, mitiche rarissime
const RARITY_WEIGHT: Record<string, number> = { common: 68, rare: 22, epic: 7, legendary: 2.4, mythic: 0.6 }

const PACKS: PackType[] = [
  {
    id: 'gli_elettronici',
    name: 'GLI ELETTRONICI',
    edition: 'Quaderno Elettronico · Software Technology',
    count: 5,
    cost: 100,
    colorA: '#00254d',
    colorB: '#0284c7',
    accent: '#38bdf8',
    tag: '★ Edizione Ufficiale Vol. 1',
    photo: '/illustrations/expansion_gli_elettronici.jpg',
    guaranteedRank: RARITY_RANK.rare,
  },
]

function weightOf(c: any): number {
  if (typeof c.dropWeight === 'number' && c.dropWeight > 0) return c.dropWeight
  return RARITY_WEIGHT[c.rarity] ?? 1
}

function pickWeighted(pool: any[]): any {
  if (pool.length === 0) return null
  const total = pool.reduce((s, c) => s + weightOf(c), 0)
  let r = Math.random() * total
  for (const c of pool) {
    r -= weightOf(c)
    if (r <= 0) return c
  }
  return pool[pool.length - 1]
}

function drawRealCards(pool: any[], count: number, minRank: number): any[] {
  if (!pool || pool.length === 0) return []
  const result: any[] = []
  const eligible = pool.filter(c => (RARITY_RANK[c.rarity] ?? 0) >= minRank)
  const guaranteed = pickWeighted(eligible.length ? eligible : pool)
  if (guaranteed) result.push(guaranteed)
  while (result.length < count) {
    const pick = pickWeighted(pool)
    if (pick) result.push(pick)
    else break
  }
  return result.sort(() => Math.random() - 0.5)
}

function TearEdge({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 300 18" style={{ width:'100%', height:18, display:'block' }} preserveAspectRatio="none">
      <path d="M0 0 L12 14 L28 3 L40 16 L55 2 L68 15 L80 4 L95 17 L108 5 L120 16 L134 2 L148 14 L160 3 L175 16 L188 4 L200 17 L214 2 L228 15 L242 5 L255 16 L268 3 L282 14 L300 0" fill={accent + 'cc'} stroke={accent} strokeWidth="0.5" />
    </svg>
  )
}

const cardAccent = (c: any) => (c?.accentColor || rarInfo(c?.rarity).color)
const isTopRarity = (c: any) => c && (c.rarity === 'legendary' || c.rarity === 'mythic' || (c.variantLevel ?? 0) >= 3)

export function PackOpening() {
  const { cards: realCards, loaded } = useRealCards()
  const { gold, spendGold, addGold } = usePlayerEconomy()
  const { addCardsToInventory } = usePlayerInventory()

  const [phase, setPhase] = useState<PackPhase>('select')
  const [selectedPack, setSelectedPack] = useState<PackType>(PACKS[0])
  const [packCount, setPackCount] = useState<1 | 5 | 10>(1)
  const [drawnCards, setDrawnCards] = useState<any[]>([])
  const [newlyDiscoveredMap, setNewlyDiscoveredMap] = useState<Record<string, boolean>>({})
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [cardVisible, setCardVisible] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [legendaryFlash, setLegendaryFlash] = useState(false)
  const [coinError, setCoinError] = useState<string | null>(null)
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'rare_plus' | 'new_only'>('all')

  const [tearY, setTearY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [topGone, setTopGone] = useState(false)
  const packRef = useRef<HTMLDivElement>(null)

  const TEAR_THRESHOLD = 160
  const tearProgress = Math.min(1, tearY / TEAR_THRESHOLD)

  const unitCost = selectedPack.cost || 100
  const totalCost = unitCost * packCount
  const totalCardsToDraw = selectedPack.count * packCount

  const triggerOpen = (countToOpen: 1 | 5 | 10 = packCount) => {
    const cost = unitCost * countToOpen
    const success = spendGold(cost)
    if (!success) {
      setCoinError(`Monete insufficienti! Ti servono ${cost} monete per aprire ${countToOpen} ${countToOpen === 1 ? 'pacchetto' : 'pacchetti'}.`)
      setPhase('select')
      setTearY(0)
      setTopGone(false)
      soundEngine.playDamage()
      return
    }

    soundEngine.playPackTear()
    setTopGone(true)
    setTimeout(() => {
      // Estrai carte per ogni pacchetto (garantendo la rarità minima per ciascuno)
      const allDrawn: any[] = []
      for (let i = 0; i < countToOpen; i++) {
        const packBatch = drawRealCards(realCards, selectedPack.count, selectedPack.guaranteedRank)
        allDrawn.push(...packBatch)
      }

      // Registra nell'inventario
      const { isNewMap } = addCardsToInventory(allDrawn)
      setNewlyDiscoveredMap(isNewMap)
      setDrawnCards(allDrawn)
      setPackCount(countToOpen)
      
      setPhase('burst')
      setTimeout(() => {
        setPhase('cards')
        setCurrentCardIdx(0)
        soundEngine.playCardFlip()
        setTimeout(() => setCardVisible(true), 80)
      }, countToOpen > 1 ? 900 : 700)
    }, 400)
  }

  useEffect(() => {
    if (tearProgress >= 1 && !topGone) triggerOpen(packCount)
  }, [tearProgress])

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true); setStartY(e.clientY)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const delta = startY - e.clientY
    setTearY(Math.max(0, delta))
  }
  const onPointerUp = () => setDragging(false)

  const nextCard = () => {
    if (currentCardIdx >= drawnCards.length - 1) { 
      soundEngine.playButtonClick()
      setShowSummary(true)
      return 
    }
    soundEngine.playCardFlip()
    setCardVisible(false)
    const nextIsTop = isTopRarity(drawnCards[currentCardIdx + 1])
    if (nextIsTop) {
      setLegendaryFlash(true)
      soundEngine.playLegendaryFanfare()
    }
    setTimeout(() => {
      setCurrentCardIdx(i => i + 1)
      setCardVisible(true)
      setTimeout(() => setLegendaryFlash(false), 800)
    }, 220)
  }

  const revealAllInstant = () => {
    soundEngine.playCardFlip()
    setShowSummary(true)
  }

  const reset = (nextCount?: 1 | 5 | 10) => {
    if (nextCount) setPackCount(nextCount)
    setPhase('select'); setDrawnCards([]); setCurrentCardIdx(0); setCardVisible(false)
    setShowSummary(false); setTearY(0); setTopGone(false); setLegendaryFlash(false)
    setNewlyDiscoveredMap({})
    setCoinError(null)
    setSummaryFilter('all')
  }

  const startOpenWithCount = (count: 1 | 5 | 10) => {
    setPackCount(count)
    const cost = unitCost * count
    if (gold < cost) {
      setCoinError(`Monete insufficienti! Ti servono ${cost} monete per aprire ${count} ${count === 1 ? 'pacchetto' : 'pacchetti'} (ne hai ${gold}).`)
      soundEngine.playDamage()
      return
    }
    setCoinError(null)
    setTearY(0)
    setTopGone(false)
    setPhase('tear')
  }

  const currentCard = drawnCards[currentCardIdx]
  const accent = currentCard ? cardAccent(currentCard) : selectedPack.accent
  const isTop = isTopRarity(currentCard)
  const isCurrentCardNew = currentCard && newlyDiscoveredMap[currentCard.id]

  const noCards = loaded && realCards.length === 0
  const canBuySelected = gold >= totalCost

  // Raggruppamento carte uguali per il riepilogo
  const groupedDrawnCards = useMemo(() => {
    const map = new Map<string, { card: any; count: number; isNew: boolean }>()
    
    drawnCards.forEach(c => {
      if (!c || !c.id) return
      const existing = map.get(c.id)
      if (existing) {
        existing.count += 1
        if (newlyDiscoveredMap[c.id]) {
          existing.isNew = true
        }
      } else {
        map.set(c.id, {
          card: c,
          count: 1,
          isNew: !!newlyDiscoveredMap[c.id],
        })
      }
    })

    // Ordina per rarità (decrescente: mythic -> legendary -> epic -> rare -> common)
    return Array.from(map.values()).sort((a, b) => {
      const rA = RARITY_RANK[a.card.rarity] ?? 0
      const rB = RARITY_RANK[b.card.rarity] ?? 0
      if (rB !== rA) return rB - rA
      if ((b.card.variantLevel ?? 0) !== (a.card.variantLevel ?? 0)) {
        return (b.card.variantLevel ?? 0) - (a.card.variantLevel ?? 0)
      }
      return (a.card.name || '').localeCompare(b.card.name || '')
    })
  }, [drawnCards, newlyDiscoveredMap])

  const newCardsCount = useMemo(() => {
    return drawnCards.filter(c => newlyDiscoveredMap[c.id]).length
  }, [drawnCards, newlyDiscoveredMap])

  const newGroupedCardsCount = useMemo(() => {
    return groupedDrawnCards.filter(g => g.isNew).length
  }, [groupedDrawnCards])

  const rarePlusCount = useMemo(() => {
    return drawnCards.filter(c => (RARITY_RANK[c.rarity] ?? 0) >= RARITY_RANK.rare).length
  }, [drawnCards])

  const filteredGroupedCards = useMemo(() => {
    if (summaryFilter === 'new_only') return groupedDrawnCards.filter(g => g.isNew)
    if (summaryFilter === 'rare_plus') return groupedDrawnCards.filter(g => (RARITY_RANK[g.card.rarity] ?? 0) >= RARITY_RANK.rare)
    return groupedDrawnCards
  }, [groupedDrawnCards, summaryFilter])

  return (
    <div style={{ height:'calc(100vh - 64px)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {legendaryFlash && (
        <div style={{ position:'fixed', inset:0, zIndex:100, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.35) 0%, transparent 70%)', animation:'legendFlash 0.8s ease-out both' }} />
      )}

      {/* Sfondo dinamico */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <div style={{ position:'absolute', inset:0, backgroundImage: phase === 'cards' ? undefined : `url(${selectedPack.photo})`, backgroundSize:'cover', backgroundPosition:'center', filter:'blur(4px) brightness(0.2)', transition:'all 0.8s ease' }} />
        <div style={{ position:'absolute', inset:0, background: phase === 'cards' ? `radial-gradient(ellipse 80% 60% at 50% 30%, ${accent}22 0%, #06080f 70%)` : `radial-gradient(ellipse 70% 50% at 50% 30%, ${selectedPack.accent}18 0%, #06080f 65%)`, transition:'background 0.8s ease' }} />
        {Array.from({length:35}, (_,i) => (
          <div key={i} style={{ position:'absolute', left:`${(i*17.3)%100}%`, top:`${(i*13.7)%100}%`, width:i%6===0?2:1, height:i%6===0?2:1, borderRadius:'50%', background:`rgba(255,255,255,${0.08+(i%5)*0.07})` }} />
        ))}
        <div className="glow-orb" style={{ position:'absolute', left:'5%', top:'15%', width:500, height:500, background:`radial-gradient(circle, ${selectedPack.accent}14 0%, transparent 70%)`, borderRadius:'50%' }} />
        <div className="glow-orb" style={{ position:'absolute', right:'5%', bottom:'10%', width:400, height:400, background:`radial-gradient(circle, ${selectedPack.accent}10 0%, transparent 70%)`, borderRadius:'50%', animationDelay:'1.5s' }} />
      </div>

      {/* FASE 1: Selezione Espansione, Quantità & Acquisto */}
      {phase === 'select' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 20px', overflowY:'auto' }}>
          
          {/* Header con Saldo Monete */}
          <div className="slide-up-1" style={{ textAlign:'center', marginBottom:16 }}>
            <div className="font-cinzel" style={{ fontSize:26, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
              <Icon.package style={{ width:26, height:26, color:'#f0a500' }} /> Negozio Bustine
            </div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.5)', marginTop:4 }}>
              {noCards ? 'Nessuna carta pubblicata: creale nel Card Creator Studio' : 'Espansione Ufficiale "Gli Elettronici"'}
            </div>

            {/* Saldo Attuale & Bonus Monete */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:16, marginTop:10, padding:'7px 18px', background:'rgba(13,17,32,0.85)', border:'1px solid rgba(240,165,0,0.3)', borderRadius:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#f0a500', fontFamily:'Cinzel, serif', fontWeight:700, fontSize:14 }}>
                <span>🪙</span> {gold} Monete
              </div>
              <button onClick={() => { addGold(500); soundEngine.playButtonClick(); }}
                style={{ background:'rgba(240,165,0,0.15)', border:'1px solid rgba(240,165,0,0.35)', color:'#f0a500', padding:'3px 9px', borderRadius:10, fontSize:10, cursor:'pointer', fontFamily:'Cinzel, serif' }}>
                +500 Bonus
              </button>
            </div>
          </div>

          {/* Avviso Monete Insufficienti */}
          {coinError && (
            <div style={{ marginBottom:14, padding:'10px 20px', background:'rgba(239,68,68,0.15)', border:'1px solid #ef4444', borderRadius:12, color:'#fca5a5', fontSize:12, animation:'shake-subtle 0.3s ease', maxWidth:500, textAlign:'center' }}>
              ⚠️ {coinError}
            </div>
          )}

          {/* Selettore Quantità Pacchetti (1x, 5x, 10x) */}
          <div style={{ display:'flex', gap:10, marginBottom:20, zIndex:10 }}>
            {([1, 5, 10] as const).map(qty => {
              const cost = unitCost * qty
              const affordable = gold >= cost
              const isSelected = packCount === qty
              return (
                <button
                  key={qty}
                  onClick={() => { setPackCount(qty); soundEngine.playButtonClick(); setCoinError(null) }}
                  className="font-cinzel"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(240,165,0,0.25) 0%, rgba(2,132,199,0.35) 100%)' 
                      : 'rgba(13,17,32,0.7)',
                    border: isSelected 
                      ? '1.5px solid #f0a500' 
                      : affordable ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(239,68,68,0.3)',
                    color: isSelected ? '#ffd700' : affordable ? '#e8dcc8' : 'rgba(232,220,200,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    minWidth: 105,
                    boxShadow: isSelected ? '0 0 20px rgba(240,165,0,0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800 }}>{qty}x {qty === 1 ? 'Pacchetto' : 'Pacchetti'}</span>
                  <span style={{ fontSize: 10, color: affordable ? '#f0a500' : '#f87171' }}>
                    🪙 {cost} · {qty * 5} carte
                  </span>
                </button>
              )
            })}
          </div>

          {/* Card Pacchetto Gigante con Effetto Stack 3D per 5x e 10x */}
          <div className="slide-up-2" style={{ display:'flex', justifyContent:'center', marginBottom:20, position:'relative' }}>
            
            {/* Strati per effetto bundle 5x o 10x */}
            {packCount >= 5 && (
              <div style={{
                position:'absolute',
                width: 240,
                height: 340,
                borderRadius: 18,
                background: 'rgba(2, 132, 199, 0.4)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                transform: 'translate(-14px, -10px) rotate(-4deg)',
                filter: 'blur(1px)',
                zIndex: 1,
              }} />
            )}
            {packCount >= 10 && (
              <div style={{
                position:'absolute',
                width: 240,
                height: 340,
                borderRadius: 18,
                background: 'rgba(240, 165, 0, 0.35)',
                border: '1px solid rgba(240, 165, 0, 0.4)',
                transform: 'translate(14px, -10px) rotate(4deg)',
                filter: 'blur(1px)',
                zIndex: 1,
              }} />
            )}

            <div 
              onClick={() => setSelectedPack(PACKS[0])}
              style={{
                width: 240,
                height: 340,
                borderRadius: 18,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: packCount === 10 ? '2px solid #ffd700' : packCount === 5 ? '2px solid #38bdf8' : '2px solid #0284c7',
                boxShadow: packCount === 10 
                  ? '0 0 50px rgba(240, 165, 0, 0.5), 0 25px 60px rgba(0,0,0,0.85)' 
                  : '0 0 40px rgba(56, 189, 248, 0.45), 0 25px 60px rgba(0,0,0,0.85)',
                transform: 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                zIndex: 2,
              }}
            >
              <img 
                src={selectedPack.photo} 
                alt={selectedPack.name} 
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} 
              />
              
              {/* Effetto lucido overlay */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 45%, rgba(0,0,0,0.4) 100%)', pointerEvents:'none' }} />
              
              {/* Linea di strappo decorativa */}
              <div style={{ position:'absolute', top:46, left:0, right:0, height:1, background:'repeating-linear-gradient(90deg, #38bdf8aa 0px, #38bdf8aa 6px, transparent 6px, transparent 12px)' }} />
              <div className="font-cinzel" style={{ position:'absolute', top:25, left:0, right:0, textAlign:'center', fontSize:7.5, color:'#38bdf8', letterSpacing:'0.18em', textTransform:'uppercase', textShadow:'0 0 8px #000' }}>
                ✂ strappa qui
              </div>

              {/* Badge Quantità & Costo in alto a destra */}
              <div style={{ position:'absolute', top:12, right:12, padding:'4px 10px', background:'rgba(0,0,0,0.85)', border:`1.5px solid ${packCount > 1 ? '#ffd700' : '#f0a500'}`, borderRadius:12, fontSize:11, color: packCount > 1 ? '#ffd700' : '#f0a500', fontFamily:'Cinzel,serif', fontWeight:800, boxShadow:'0 0 12px rgba(240,165,0,0.4)' }}>
                {packCount}x · 🪙 {totalCost}
              </div>

              {/* Dettagli footer */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 12px', background:'linear-gradient(180deg, transparent 0%, rgba(0,25,60,0.95) 100%)', textAlign:'center' }}>
                <div className="font-cinzel-deco" style={{ fontSize:15, fontWeight:800, color: packCount === 10 ? '#ffd700' : '#38bdf8', letterSpacing:'0.04em', textTransform:'uppercase', textShadow:'0 0 15px rgba(56,189,248,0.7)' }}>
                  {selectedPack.name}
                </div>
                <div style={{ fontSize:9, color:'rgba(232,220,200,0.7)', marginTop:3 }}>
                  {packCount > 1 ? `Bundle ${packCount} Bustine (${totalCardsToDraw} Carte)` : selectedPack.edition}
                </div>
                <div style={{ marginTop:6, padding:'3px 12px', background: packCount > 1 ? 'rgba(240,165,0,0.2)' : 'rgba(56,189,248,0.2)', border: packCount > 1 ? '1px solid rgba(240,165,0,0.4)' : '1px solid #38bdf855', borderRadius:12, fontSize:8.5, color: packCount > 1 ? '#ffd700' : '#7dd3fc', fontFamily:'Cinzel,serif', fontWeight:700, display:'inline-block' }}>
                  {packCount > 1 ? `★ ${packCount}x Rare+ Garantite` : selectedPack.tag}
                </div>
              </div>
            </div>
          </div>

          {/* Pulsante Principale di Acquisto */}
          <div className="slide-up-3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <button 
              className="btn-primary font-cinzel badge-pulse" 
              onClick={() => startOpenWithCount(packCount)} 
              disabled={noCards}
              style={{ 
                padding:'15px 44px', 
                borderRadius:14, 
                background: canBuySelected 
                  ? (packCount === 10 ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #0284c7, #0369a1)')
                  : 'rgba(255,255,255,0.08)', 
                border: canBuySelected 
                  ? (packCount === 10 ? '1px solid #ffd700' : '1px solid #38bdf8')
                  : '1px solid rgba(255,255,255,0.1)', 
                color: canBuySelected ? '#ffffff' : 'rgba(232,220,200,0.4)', 
                fontSize:15, 
                fontWeight:700, 
                letterSpacing:'0.08em', 
                textTransform:'uppercase', 
                cursor: noCards ? 'not-allowed' : 'pointer', 
                boxShadow: canBuySelected ? '0 10px 35px rgba(56,189,248,0.4), 0 4px 12px rgba(0,0,0,0.5)' : 'none' 
              }}
            >
              <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Icon.zap style={{ width:18, height:18, color: '#f0a500' }} /> 
                Apri {packCount}x {packCount === 1 ? 'Bustina' : 'Bustine'} · {totalCost} 🪙
              </span>
            </button>
            
            {/* Quick Actions per aprire direttamente 1x, 5x, 10x */}
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {([1, 5, 10] as const).map(qty => {
                const cost = unitCost * qty
                const affordable = gold >= cost
                return (
                  <button
                    key={qty}
                    onClick={() => startOpenWithCount(qty)}
                    disabled={!affordable}
                    className="font-cinzel"
                    style={{
                      padding:'5px 12px',
                      borderRadius:8,
                      background: affordable ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: affordable ? '1px solid rgba(240,165,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      color: affordable ? '#f0a500' : 'rgba(232,220,200,0.3)',
                      fontSize:10,
                      fontWeight:600,
                      cursor: affordable ? 'pointer' : 'not-allowed',
                      transition:'all 0.2s ease',
                    }}
                  >
                    ⚡ Rapido {qty}x ({cost} 🪙)
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize:11, color:'rgba(232,220,200,0.45)', marginTop:2 }}>
              {packCount === 1 && 'Contiene 5 Carte · Una Rara o Superiore Garantita!'}
              {packCount === 5 && 'Contiene 25 Carte · 5 Rare o Superiori Garantite!'}
              {packCount === 10 && 'Contiene 50 Carte · 10 Rare o Superiori Garantite · Alta probabilità Leggendarie/Mitiche!'}
            </div>
          </div>
        </div>
      )}

      {/* FASE 2: Strappo Bustina 3D (Singola o Bundle) */}
      {phase === 'tear' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', userSelect:'none' }}>
          <div className="font-cinzel" style={{ position:'absolute', top:24, fontSize:12, color:`${selectedPack.accent}cc`, letterSpacing:'0.2em', textTransform:'uppercase', animation: tearProgress > 0.05 ? 'none' : 'badge-pulse 2s ease infinite', opacity: Math.max(0, 1 - tearProgress * 3), display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>☝</span> Trascina verso l'alto per aprire {packCount}x {packCount === 1 ? 'bustina' : 'bustine'} ({totalCardsToDraw} carte)
          </div>
          <div style={{ position:'absolute', top:56, width:220, height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, width:`${tearProgress * 100}%`, background:`linear-gradient(90deg, ${selectedPack.accent}, ${packCount > 1 ? '#ffd700' : selectedPack.accent}aa)`, transition:'width 0.05s linear', boxShadow:`0 0 8px ${selectedPack.accent}` }} />
          </div>

          <div ref={packRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            style={{ width:260, height:380, position:'relative', cursor: dragging ? 'grabbing' : 'grab', touchAction:'none', filter:`drop-shadow(0 0 40px ${packCount > 1 ? 'rgba(240,165,0,0.45)' : selectedPack.accent + '44'})` }}>
            
            {/* Effetto Stack visivo dietro la bustina */}
            {packCount >= 5 && (
              <div style={{ position:'absolute', inset:0, borderRadius:20, background:'rgba(2,132,199,0.3)', transform:'translate(-10px, 8px) rotate(-3deg)', zIndex:0 }} />
            )}
            {packCount >= 10 && (
              <div style={{ position:'absolute', inset:0, borderRadius:20, background:'rgba(240,165,0,0.3)', transform:'translate(10px, 8px) rotate(3deg)', zIndex:0 }} />
            )}

            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${380 - 100}px`, borderRadius:'0 0 20px 20px', overflow:'hidden', boxShadow:`0 30px 80px rgba(0,0,0,0.9)`, zIndex:2 }}>
              <img src={selectedPack.photo} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6)' }} />
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, rgba(0,0,0,0.3) 0%, ${selectedPack.colorA}ee 100%)` }} />
              <div style={{ position:'absolute', top:-1, left:0, right:0, zIndex:2 }}><TearEdge accent={packCount > 1 ? '#ffd700' : selectedPack.accent} /></div>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, paddingTop:20 }}>
                <div className="font-cinzel-deco" style={{ fontSize:22, fontWeight:700, color: packCount > 1 ? '#ffd700' : selectedPack.accent, letterSpacing:'0.04em', textTransform:'uppercase', textShadow:`0 0 20px ${selectedPack.accent}66` }}>
                  {packCount > 1 ? `${packCount}x BUNDLE` : selectedPack.name}
                </div>
                <div className="font-cinzel" style={{ fontSize:9, color:'rgba(232,220,200,0.6)', letterSpacing:'0.15em', textTransform:'uppercase' }}>
                  {packCount > 1 ? `${totalCardsToDraw} CARTE · ${packCount} RARE+` : selectedPack.edition}
                </div>
                <div style={{ marginTop:4, padding:'4px 14px', background:`${selectedPack.accent}22`, border:`1px solid ${selectedPack.accent}44`, borderRadius:20, fontSize:9, color:selectedPack.accent }}>
                  {totalCardsToDraw} carte da gioco
                </div>
              </div>
              <div className="font-cinzel" style={{ position:'absolute', bottom:14, left:0, right:0, textAlign:'center', fontSize:8, color:`${selectedPack.accent}aa`, letterSpacing:'0.12em' }}>
                {packCount > 1 ? `★ ${packCount} BUSTINE UFFICIALI` : selectedPack.tag}
              </div>
            </div>

            {!topGone && (
              <div style={{ position:'absolute', top:0, left:0, right:0, height:110, borderRadius:'20px 20px 0 0', overflow:'hidden', transformOrigin:'50% 100%', transform:`translateY(${-tearProgress * 180}px) rotate(${tearProgress * -18}deg) scaleX(${1 - tearProgress * 0.3})`, opacity: 1 - tearProgress * 0.8, transition: dragging ? 'none' : 'transform 0.1s ease', zIndex:3 }}>
                <img src={selectedPack.photo} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', filter:'brightness(0.6)' }} />
                <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, ${selectedPack.colorA}cc 0%, rgba(0,0,0,0.2) 100%)` }} />
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`repeating-linear-gradient(90deg, ${selectedPack.accent} 0px, ${selectedPack.accent} 8px, transparent 8px, transparent 16px)` }} />
                <div className="font-cinzel" style={{ position:'absolute', bottom:10, left:0, right:0, textAlign:'center', fontSize:7, color:`${selectedPack.accent}cc`, letterSpacing:'0.2em', textTransform:'uppercase' }}>✂ strappa qui per aprire</div>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:20, background:`linear-gradient(180deg, ${selectedPack.colorB} 0%, transparent 100%)` }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 50%)' }} />
              </div>
            )}
          </div>
          {tearProgress > 0.05 && tearProgress < 1 && (
            <div className="font-cinzel" style={{ marginTop:20, fontSize:11, color:`${selectedPack.accent}cc`, letterSpacing:'0.12em' }}>{Math.round(tearProgress * 100)}%</div>
          )}
        </div>
      )}

      {/* FASE 3: Esplosione Particellare */}
      {phase === 'burst' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width: 200 + packCount * 15, height: 200 + packCount * 15, borderRadius:'50%', background:`radial-gradient(circle, ${packCount > 1 ? '#ffd700' : selectedPack.accent}cc 0%, transparent 70%)`, animation:'burstPulse 0.8s ease-out both', filter:`blur(25px)` }} />
          {Array.from({length: 16 + packCount * 3}, (_,i) => (
            <div key={i} style={{ position:'absolute', width: 4 + (i%3)*3, height: 4 + (i%3)*3, borderRadius:'50%', background: i%3===0 ? selectedPack.accent : i%3===1 ? '#ffd700' : 'white', animation:`burstParticle${i%4} 0.8s ease-out both`, left:'50%', top:'50%' }} />
          ))}
        </div>
      )}

      {/* FASE 4: Rivelazione Carte (con tasto Rivela Tutte per multi-pack) */}
      {phase === 'cards' && currentCard && !showSummary && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          
          {/* Header Barra di Progresso */}
          <div style={{ position:'absolute', top:16, left:20, right:20, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div className="font-cinzel" style={{ fontSize:11, color:'rgba(232,220,200,0.7)', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:12 }}>
              <span>Pacchetto {Math.floor(currentCardIdx / 5) + 1} di {packCount}</span>
              <span>·</span>
              <span style={{ color:'#f0a500', fontWeight:700 }}>Carta {currentCardIdx + 1} di {drawnCards.length}</span>
            </div>

            {/* Indicatori sintetici */}
            <div style={{ display:'flex', justifyContent:'center', gap: drawnCards.length > 20 ? 3 : 6, flexWrap:'wrap', maxWidth: 600 }}>
              {drawnCards.map((c,i) => {
                const isCurrent = i === currentCardIdx
                const isPast = i < currentCardIdx
                const dotWidth = drawnCards.length > 25 ? (isCurrent ? 16 : 4) : (isCurrent ? 28 : 6)
                return (
                  <div key={i} style={{ width: dotWidth, height:6, borderRadius:3, background: isPast ? cardAccent(c) : isCurrent ? selectedPack.accent : 'rgba(255,255,255,0.12)', boxShadow: isCurrent ? `0 0 8px ${selectedPack.accent}` : 'none', transition:'all 0.25s ease' }} />
                )
              })}
            </div>
          </div>

          {/* Badge "NUOVA CARTA SCOPERTA!" */}
          {isCurrentCardNew && (
            <div style={{ position:'absolute', top:52, animation:'badge-pulse 1.5s ease infinite', zIndex:20 }}>
              <div style={{ padding:'6px 16px', background:'linear-gradient(135deg, #f0a500, #d97706)', borderRadius:20, color:'#06080f', fontFamily:'Cinzel, serif', fontWeight:800, fontSize:11, letterSpacing:'0.08em', boxShadow:'0 0 20px rgba(240,165,0,0.6)' }}>
                ✨ NUOVA CARTA SCOPERTA! ✨
              </div>
            </div>
          )}

          {isTop && !isCurrentCardNew && (
            <div style={{ position:'absolute', top:52, left:0, right:0, textAlign:'center', animation:'slide-up 0.5s ease both' }}>
              <div className="font-cinzel" style={{ fontSize:13, fontWeight:700, color:'#ffd700', letterSpacing:'0.2em', textTransform:'uppercase', textShadow:'0 0 20px #ffd700', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon.star style={{ width:16, height:16 }} /> {rarInfo(currentCard.rarity).label.replace(/^[^A-Za-z]+/, '')}! <Icon.star style={{ width:16, height:16 }} />
              </div>
            </div>
          )}

          <div style={{ transform: cardVisible ? 'scale(1) rotateY(0deg)' : 'scale(0.3) rotateY(90deg)', opacity: cardVisible ? 1 : 0, transition:'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease', marginTop: (isTop || isCurrentCardNew) ? 36 : 10 }}>
            <RealBigCard card={currentCard} />
          </div>

          {/* Pulsanti Prossima Carta e Rivela Tutte */}
          <div style={{ display:'flex', gap:12, marginTop:20, alignItems:'center' }}>
            <button onClick={nextCard} className="btn-primary font-cinzel"
              style={{ padding:'12px 32px', borderRadius:12, background: currentCardIdx >= drawnCards.length - 1 ? 'linear-gradient(135deg,#f0a500,#d4842a)' : `linear-gradient(135deg, ${selectedPack.accent}cc, ${selectedPack.colorB}aa)`, border:'none', color:'#06080f', fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', boxShadow:`0 8px 28px ${selectedPack.accent}44`, opacity: cardVisible ? 1 : 0, transition:'opacity 0.4s ease 0.2s' }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                {currentCardIdx >= drawnCards.length - 1 ? <><Icon.check style={{ width:14,height:14 }} /> Vedi Riepilogo</> : <><Icon.zap style={{ width:14,height:14 }} /> Prossima ({currentCardIdx+2}/{drawnCards.length})</>}
              </span>
            </button>

            {drawnCards.length > 1 && (
              <button 
                onClick={revealAllInstant} 
                className="font-cinzel"
                style={{ padding:'12px 20px', borderRadius:12, background:'rgba(13,17,32,0.85)', border:'1px solid rgba(240,165,0,0.4)', color:'#f0a500', fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,165,0,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(13,17,32,0.85)' }}
              >
                ⚡ Rivela Tutte ({drawnCards.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* FASE 5: Riepilogo Carte Trovate (Raggruppate) */}
      {(phase === 'cards' && showSummary) && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px', overflowY:'auto', animation:'slide-up 0.55s ease both' }}>
          <div className="font-cinzel" style={{ fontSize:22, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4, textAlign:'center' }}>
            🎉 {drawnCards.length} Carte Trovate!
          </div>
          <div style={{ fontSize:12, color:'rgba(232,220,200,0.5)', marginBottom:16 }}>
            {selectedPack.name} · {packCount} {packCount === 1 ? 'Bustina Aperta' : 'Bustine Aperte'} ({drawnCards.length} Carte Totali · {groupedDrawnCards.length} Carte Uniche)
          </div>

          {/* Filtri e statistiche sintetiche */}
          <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', justifyContent:'center' }}>
            <button 
              onClick={() => setSummaryFilter('all')}
              className="font-cinzel"
              style={{ padding:'6px 14px', borderRadius:20, background: summaryFilter === 'all' ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)', border: summaryFilter === 'all' ? '1px solid #f0a500' : '1px solid rgba(255,255,255,0.1)', color: summaryFilter === 'all' ? '#f0a500' : 'rgba(232,220,200,0.6)', fontSize:10, cursor:'pointer' }}>
              Tutte ({groupedDrawnCards.length} Uniche)
            </button>
            <button 
              onClick={() => setSummaryFilter('rare_plus')}
              className="font-cinzel"
              style={{ padding:'6px 14px', borderRadius:20, background: summaryFilter === 'rare_plus' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)', border: summaryFilter === 'rare_plus' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', color: summaryFilter === 'rare_plus' ? '#38bdf8' : 'rgba(232,220,200,0.6)', fontSize:10, cursor:'pointer' }}>
              Rare o Superiori ({rarePlusCount})
            </button>
            {newCardsCount > 0 && (
              <button 
                onClick={() => setSummaryFilter('new_only')}
                className="font-cinzel"
                style={{ padding:'6px 14px', borderRadius:20, background: summaryFilter === 'new_only' ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', border: summaryFilter === 'new_only' ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)', color: summaryFilter === 'new_only' ? '#eab308' : 'rgba(232,220,200,0.6)', fontSize:10, cursor:'pointer' }}>
                ✨ Solo Nuove ({newGroupedCardsCount})
              </button>
            )}
          </div>

          {/* Badge conteggi per rarità */}
          <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap', justifyContent:'center' }}>
            {(['mythic','legendary','epic','rare','common']).map(r => {
              const cnt = drawnCards.filter(c => c.rarity === r).length
              if (!cnt) return null
              const meta = REAL_RARITY[r]
              return (
                <div key={r} style={{ padding:'8px 14px', borderRadius:10, background:`${meta.color}14`, border:`1px solid ${meta.color}44`, textAlign:'center', minWidth:60 }}>
                  <div className="font-cinzel" style={{ fontSize:18, fontWeight:700, color:meta.color }}>{cnt}</div>
                  <div style={{ fontSize:7.5, color:'rgba(232,220,200,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:1 }}>{meta.label.replace(/^[^A-Za-z]+/, '')}</div>
                </div>
              )
            })}
          </div>

          {/* Griglia Carte Trovate (Raggruppate con Badge Quantità xN) */}
          <div style={{ display:'flex', gap:14, marginBottom:28, flexWrap:'wrap', justifyContent:'center', maxWidth:1100 }}>
            {filteredGroupedCards.map((group, i) => (
              <div key={group.card.id} style={{ animation:`slide-up 0.4s ease ${Math.min(i * 0.04, 1)}s both`, position:'relative' }}>
                <RealCardTile card={group.card} />
                
                {/* Badge Copie Duplicate (es. x3, x5) */}
                {group.count > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'linear-gradient(135deg, #f0a500, #d97706)',
                    color: '#06080f',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 900,
                    fontFamily: 'Cinzel, serif',
                    border: '2px solid #0d1120',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 10px rgba(240,165,0,0.5)',
                    zIndex: 25,
                    animation: 'badge-pulse 2s infinite',
                  }}>
                    x{group.count}
                  </div>
                )}

                {/* Badge NUOVA! */}
                {group.isNew && (
                  <div style={{ position:'absolute', bottom:-9, left:'50%', transform:'translateX(-50%)', background:'#f0a500', color:'#06080f', padding:'2px 8px', borderRadius:10, fontSize:8.5, fontWeight:800, fontFamily:'Cinzel, serif', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(0,0,0,0.5)', zIndex:20 }}>
                    NUOVA!
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pulsanti per riaprire subito o tornare al negozio */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', paddingBottom:20 }}>
            <button onClick={() => reset(1)} className="font-cinzel"
              style={{ padding:'11px 20px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', color:'#e8dcc8', fontSize:11, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>
              Apri 1x (100 🪙)
            </button>
            <button onClick={() => reset(5)} className="font-cinzel"
              style={{ padding:'11px 20px', borderRadius:10, background:'rgba(2,132,199,0.2)', border:'1px solid #38bdf8', color:'#38bdf8', fontSize:11, fontWeight:700, textTransform:'uppercase', cursor:'pointer' }}>
              Apri 5x (500 🪙)
            </button>
            <button onClick={() => reset(10)} className="btn-primary font-cinzel"
              style={{ padding:'11px 24px', borderRadius:10, background:'linear-gradient(135deg,#f0a500,#d4842a)', border:'none', color:'#06080f', fontSize:11, fontWeight:700, textTransform:'uppercase', cursor:'pointer', boxShadow:'0 6px 20px rgba(240,165,0,0.4)' }}>
              Apri 10x (1000 🪙)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

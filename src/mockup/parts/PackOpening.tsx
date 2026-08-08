import { useState, useEffect, useRef } from 'react'
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

const VARIANT_LABEL: Record<string, string> = { 
  standard: '📜 Classica', 
  holo: '✨ Holo', 
  gold_foil: '🌟 Gold Foil', 
  full_art: '🎨 Full-Art', 
  secret_holo: '👑 Secret Rare' 
}

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
  const [drawnCards, setDrawnCards] = useState<any[]>([])
  const [newlyDiscoveredMap, setNewlyDiscoveredMap] = useState<Record<string, boolean>>({})
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [cardVisible, setCardVisible] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [legendaryFlash, setLegendaryFlash] = useState(false)
  const [coinError, setCoinError] = useState(false)

  const [tearY, setTearY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [topGone, setTopGone] = useState(false)
  const packRef = useRef<HTMLDivElement>(null)

  const TEAR_THRESHOLD = 160
  const tearProgress = Math.min(1, tearY / TEAR_THRESHOLD)

  const triggerOpen = () => {
    // 1. Spesa delle monete
    const packCost = selectedPack.cost || 100
    const success = spendGold(packCost)
    if (!success) {
      setCoinError(true)
      setPhase('select')
      setTearY(0)
      setTopGone(false)
      soundEngine.playDamage()
      return
    }

    soundEngine.playPackTear()
    setTopGone(true)
    setTimeout(() => {
      const cards = drawRealCards(realCards, selectedPack.count, selectedPack.guaranteedRank)
      
      // 2. Registra le carte trovate nell'inventario del giocatore
      const { isNewMap } = addCardsToInventory(cards)
      setNewlyDiscoveredMap(isNewMap)
      setDrawnCards(cards)
      
      setPhase('burst')
      setTimeout(() => {
        setPhase('cards')
        setCurrentCardIdx(0)
        soundEngine.playCardFlip()
        setTimeout(() => setCardVisible(true), 80)
      }, 700)
    }, 400)
  }

  useEffect(() => {
    if (tearProgress >= 1 && !topGone) triggerOpen()
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
    }, 250)
  }

  const reset = () => {
    setPhase('select'); setDrawnCards([]); setCurrentCardIdx(0); setCardVisible(false)
    setShowSummary(false); setTearY(0); setTopGone(false); setLegendaryFlash(false)
    setNewlyDiscoveredMap({})
    setCoinError(false)
  }

  const goToTear = () => {
    if (gold < (selectedPack.cost || 100)) {
      setCoinError(true)
      soundEngine.playDamage()
      return
    }
    setCoinError(false)
    setTearY(0)
    setTopGone(false)
    setPhase('tear')
  }

  const currentCard = drawnCards[currentCardIdx]
  const accent = currentCard ? cardAccent(currentCard) : selectedPack.accent
  const isTop = isTopRarity(currentCard)
  const isCurrentCardNew = currentCard && newlyDiscoveredMap[currentCard.id]

  const noCards = loaded && realCards.length === 0
  const canBuy = gold >= (selectedPack.cost || 100)

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

      {/* FASE 1: Selezione Espansione & Acquisto */}
      {phase === 'select' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px', overflowY:'auto' }}>
          
          {/* Header con Saldo Monete */}
          <div className="slide-up-1" style={{ textAlign:'center', marginBottom:20 }}>
            <div className="font-cinzel" style={{ fontSize:26, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
              <Icon.package style={{ width:26, height:26, color:'#f0a500' }} /> Negozio Bustine
            </div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.5)', marginTop:6 }}>
              {noCards ? 'Nessuna carta pubblicata: creale nel Card Creator Studio' : 'Espansione Ufficiale "Gli Elettronici"'}
            </div>

            {/* Saldo Attuale & Bonus Monete */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:16, marginTop:12, padding:'8px 18px', background:'rgba(13,17,32,0.8)', border:'1px solid rgba(240,165,0,0.3)', borderRadius:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#f0a500', fontFamily:'Cinzel, serif', fontWeight:700, fontSize:14 }}>
                <span>🪙</span> {gold} Monete
              </div>
              <button onClick={() => { addGold(200); soundEngine.playButtonClick(); }}
                style={{ background:'rgba(240,165,0,0.15)', border:'1px solid rgba(240,165,0,0.35)', color:'#f0a500', padding:'3px 8px', borderRadius:10, fontSize:10, cursor:'pointer', fontFamily:'Cinzel, serif' }}>
                +200 Bonus
              </button>
            </div>
          </div>

          {/* Avviso Monete Insufficienti */}
          {coinError && (
            <div style={{ marginBottom:16, padding:'10px 20px', background:'rgba(239,68,68,0.15)', border:'1px solid #ef4444', borderRadius:12, color:'#fca5a5', fontSize:12, animation:'shake-subtle 0.3s ease' }}>
              ⚠️ Monete insufficienti! Ti servono 100 monete. Vinci nell'Arena o usa il pulsante Bonus.
            </div>
          )}

          {/* Card Pacchetto Gigante Ufficiale */}
          <div className="slide-up-2" style={{ display:'flex', justifyContent:'center', marginBottom:28 }}>
            <div 
              onClick={() => setSelectedPack(PACKS[0])}
              style={{
                width: 240,
                height: 350,
                borderRadius: 18,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 40px rgba(56, 189, 248, 0.45), 0 25px 60px rgba(0,0,0,0.85)',
                transform: 'scale(1.02)',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
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
              <div style={{ position:'absolute', top:48, left:0, right:0, height:1, background:'repeating-linear-gradient(90deg, #38bdf8aa 0px, #38bdf8aa 6px, transparent 6px, transparent 12px)' }} />
              <div className="font-cinzel" style={{ position:'absolute', top:26, left:0, right:0, textAlign:'center', fontSize:7.5, color:'#38bdf8', letterSpacing:'0.18em', textTransform:'uppercase', textShadow:'0 0 8px #000' }}>✂ strappa qui</div>

              {/* Badge Costo in alto a destra */}
              <div style={{ position:'absolute', top:12, right:12, padding:'4px 10px', background:'rgba(0,0,0,0.85)', border:'1.5px solid #f0a500', borderRadius:12, fontSize:11, color:'#f0a500', fontFamily:'Cinzel,serif', fontWeight:800, boxShadow:'0 0 12px rgba(240,165,0,0.4)' }}>
                🪙 100
              </div>

              {/* Dettagli footer */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 12px', background:'linear-gradient(180deg, transparent 0%, rgba(0,25,60,0.95) 100%)', textAlign:'center' }}>
                <div className="font-cinzel-deco" style={{ fontSize:15, fontWeight:800, color:'#38bdf8', letterSpacing:'0.04em', textTransform:'uppercase', textShadow:'0 0 15px rgba(56,189,248,0.7)' }}>
                  {selectedPack.name}
                </div>
                <div style={{ fontSize:9, color:'rgba(232,220,200,0.7)', marginTop:3 }}>
                  {selectedPack.edition}
                </div>
                <div style={{ marginTop:6, padding:'3px 12px', background:'rgba(56,189,248,0.2)', border:'1px solid #38bdf855', borderRadius:12, fontSize:8.5, color:'#7dd3fc', fontFamily:'Cinzel,serif', fontWeight:700, display:'inline-block' }}>
                  {selectedPack.tag}
                </div>
              </div>
            </div>
          </div>

          {/* Pulsante di Acquisto & Strappo */}
          <div className="slide-up-3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <button 
              className="btn-primary font-cinzel badge-pulse" 
              onClick={goToTear} 
              disabled={noCards}
              style={{ 
                padding:'16px 48px', 
                borderRadius:14, 
                background: canBuy ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255,255,255,0.08)', 
                border: canBuy ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', 
                color: canBuy ? '#ffffff' : 'rgba(232,220,200,0.4)', 
                fontSize:15, 
                fontWeight:700, 
                letterSpacing:'0.08em', 
                textTransform:'uppercase', 
                cursor: noCards ? 'not-allowed' : 'pointer', 
                boxShadow: canBuy ? '0 10px 35px rgba(56,189,248,0.4), 0 4px 12px rgba(0,0,0,0.5)' : 'none' 
              }}
            >
              <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Icon.zap style={{ width:18, height:18, color: '#f0a500' }} /> 
                Acquista & Apri · 100 🪙
              </span>
            </button>
            <div style={{ fontSize:11, color:'rgba(232,220,200,0.4)' }}>
              Contiene 5 Carte · Una Rara o Superiore Garantita!
            </div>
          </div>
        </div>
      )}

      {/* FASE 2: Strappo Bustina 3D */}
      {phase === 'tear' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', userSelect:'none' }}>
          <div className="font-cinzel" style={{ position:'absolute', top:28, fontSize:12, color:`${selectedPack.accent}cc`, letterSpacing:'0.2em', textTransform:'uppercase', animation: tearProgress > 0.05 ? 'none' : 'badge-pulse 2s ease infinite', opacity: Math.max(0, 1 - tearProgress * 3), display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>☝</span> Trascina verso l'alto per strappare
          </div>
          <div style={{ position:'absolute', top:60, width:200, height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, width:`${tearProgress * 100}%`, background:`linear-gradient(90deg, ${selectedPack.accent}, ${selectedPack.accent}aa)`, transition:'width 0.05s linear', boxShadow:`0 0 8px ${selectedPack.accent}` }} />
          </div>
          <div ref={packRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            style={{ width:260, height:380, position:'relative', cursor: dragging ? 'grabbing' : 'grab', touchAction:'none', filter:`drop-shadow(0 0 40px ${selectedPack.accent}44)` }}>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${380 - 100}px`, borderRadius:'0 0 20px 20px', overflow:'hidden', boxShadow:`0 30px 80px rgba(0,0,0,0.9)` }}>
              <img src={selectedPack.photo} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6)' }} />
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, rgba(0,0,0,0.3) 0%, ${selectedPack.colorA}ee 100%)` }} />
              <div style={{ position:'absolute', top:-1, left:0, right:0, zIndex:2 }}><TearEdge accent={selectedPack.accent} /></div>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, paddingTop:20 }}>
                <div className="font-cinzel-deco" style={{ fontSize:22, fontWeight:700, color:selectedPack.accent, letterSpacing:'0.04em', textTransform:'uppercase', textShadow:`0 0 20px ${selectedPack.accent}66` }}>{selectedPack.name}</div>
                <div className="font-cinzel" style={{ fontSize:9, color:'rgba(232,220,200,0.5)', letterSpacing:'0.15em', textTransform:'uppercase' }}>{selectedPack.edition}</div>
                <div style={{ marginTop:4, padding:'4px 14px', background:`${selectedPack.accent}22`, border:`1px solid ${selectedPack.accent}44`, borderRadius:20, fontSize:9, color:selectedPack.accent }}>{selectedPack.count} carte da gioco</div>
              </div>
              <div className="font-cinzel" style={{ position:'absolute', bottom:14, left:0, right:0, textAlign:'center', fontSize:8, color:`${selectedPack.accent}aa`, letterSpacing:'0.12em' }}>{selectedPack.tag}</div>
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
            <div className="font-cinzel" style={{ marginTop:24, fontSize:11, color:`${selectedPack.accent}cc`, letterSpacing:'0.12em' }}>{Math.round(tearProgress * 100)}%</div>
          )}
        </div>
      )}

      {/* FASE 3: Esplosione Particellare */}
      {phase === 'burst' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle, ${selectedPack.accent}cc 0%, transparent 70%)`, animation:'burstPulse 0.7s ease-out both', filter:`blur(20px)` }} />
          {Array.from({length:16}, (_,i) => (
            <div key={i} style={{ position:'absolute', width: 4 + (i%3)*3, height: 4 + (i%3)*3, borderRadius:'50%', background: i%3===0 ? selectedPack.accent : i%3===1 ? '#ffd700' : 'white', animation:`burstParticle${i%4} 0.7s ease-out both`, left:'50%', top:'50%' }} />
          ))}
        </div>
      )}

      {/* FASE 4: Rivelazione Carte Una ad Una */}
      {phase === 'cards' && currentCard && !showSummary && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ position:'absolute', top:20, left:0, right:0, display:'flex', justifyContent:'center', gap:8 }}>
            {drawnCards.map((c,i) => {
              const isCurrent = i === currentCardIdx
              const isPast = i < currentCardIdx
              return (
                <div key={i} style={{ width: isCurrent ? 32 : 8, height:8, borderRadius:4, background: isPast ? cardAccent(c) : isCurrent ? selectedPack.accent : 'rgba(255,255,255,0.12)', boxShadow: isCurrent ? `0 0 10px ${selectedPack.accent}` : 'none', transition:'all 0.3s ease' }} />
              )
            })}
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

          <div style={{ transform: cardVisible ? 'scale(1) rotateY(0deg)' : 'scale(0.3) rotateY(90deg)', opacity: cardVisible ? 1 : 0, transition:'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease', marginTop: (isTop || isCurrentCardNew) ? 36 : 10 }}>
            <RealBigCard card={currentCard} />
          </div>

          <button onClick={nextCard} className="btn-primary font-cinzel"
            style={{ marginTop:24, padding:'13px 40px', borderRadius:12, background: currentCardIdx >= drawnCards.length - 1 ? 'linear-gradient(135deg,#f0a500,#d4842a)' : `linear-gradient(135deg, ${selectedPack.accent}cc, ${selectedPack.colorB}aa)`, border:'none', color:'#06080f', fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', boxShadow:`0 8px 28px ${selectedPack.accent}44`, opacity: cardVisible ? 1 : 0, transition:'opacity 0.4s ease 0.3s' }}>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
              {currentCardIdx >= drawnCards.length - 1 ? <><Icon.check style={{ width:14,height:14 }} /> Vedi Riepilogo</> : <><Icon.zap style={{ width:14,height:14 }} /> Prossima Carta ({currentCardIdx+2}/{drawnCards.length})</>}
            </span>
          </button>
        </div>
      )}

      {/* FASE 5: Riepilogo Carte Trovate */}
      {(phase === 'cards' && showSummary) && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 24px', overflowY:'auto', animation:'slide-up 0.6s ease both' }}>
          <div className="font-cinzel" style={{ fontSize:22, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6, textAlign:'center' }}>Pacchetto Aperto!</div>
          <div style={{ fontSize:12, color:'rgba(232,220,200,0.5)', marginBottom:24 }}>{selectedPack.name} · {selectedPack.edition}</div>

          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
            {drawnCards.map((card, i) => (
              <div key={i} style={{ animation:`slide-up 0.5s ease ${i*0.1}s both`, position:'relative' }}>
                <RealCardTile card={card} />
                {newlyDiscoveredMap[card.id] && (
                  <div style={{ position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)', background:'#f0a500', color:'#06080f', padding:'2px 8px', borderRadius:10, fontSize:9, fontWeight:800, fontFamily:'Cinzel, serif', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(0,0,0,0.5)', zIndex:20 }}>
                    NUOVA!
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
            {(['mythic','legendary','epic','rare','common']).map(r => {
              const cnt = drawnCards.filter(c => c.rarity === r).length
              if (!cnt) return null
              const meta = REAL_RARITY[r]
              return (
                <div key={r} style={{ padding:'10px 18px', borderRadius:12, background:`${meta.color}12`, border:`1px solid ${meta.color}44`, textAlign:'center', minWidth:70 }}>
                  <div className="font-cinzel" style={{ fontSize:20, fontWeight:700, color:meta.color }}>{cnt}</div>
                  <div style={{ fontSize:8, color:'rgba(232,220,200,0.45)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{meta.label.replace(/^[^A-Za-z]+/, '')}</div>
                </div>
              )
            })}
          </div>

          <div style={{ display:'flex', gap:14 }}>
            <button onClick={reset} className="btn-primary font-cinzel" style={{ padding:'13px 36px', borderRadius:12, background:'linear-gradient(135deg,#f0a500,#d4842a)', border:'none', color:'#06080f', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', boxShadow:'0 8px 28px rgba(240,165,0,0.4)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}><Icon.package style={{ width:14,height:14 }} /> Apri un Altro (100 🪙)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

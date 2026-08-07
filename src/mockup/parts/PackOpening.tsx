import { useState, useEffect, useRef } from 'react'
import { CATALOG, ELEMENT_META, RARITY_META, Icon } from '../NewUI'
import type { Card, Rarity, Element } from '../NewUI'
import { BigCard } from '../cards'

type PackPhase = 'select' | 'tear' | 'burst' | 'cards' | 'done'

interface PackType {
  id: string; name: string; edition: string; count: number
  colorA: string; colorB: string; accent: string; tag: string
  available: number; photo: string; elements: Element[]
}

const PACKS: PackType[] = [
  { id:'fire', name:'Inferno Rising', edition:'Edizione Fuoco', count:5, colorA:'#3d0800', colorB:'#7a1500', accent:'#f87171', tag:'★ Garantita Leggendaria', available:3, photo:'https://images.unsplash.com/photo-1761845086689-e90380bac227?w=600&h=900&fit=crop&auto=format', elements:['fuoco'] },
  { id:'storm', name:'Thunder Crown', edition:'Edizione Fulmine', count:5, colorA:'#1a1200', colorB:'#3d3000', accent:'#facc15', tag:'◆ Garantita Rara+', available:1, photo:'https://images.unsplash.com/photo-1508697014387-db70aad34f4d?w=600&h=900&fit=crop&auto=format', elements:['fulmine'] },
  { id:'void', name:'Void Shadows', edition:'Edizione Oscura', count:5, colorA:'#1a0030', colorB:'#30005a', accent:'#c084fc', tag:'★ Pack Speciale Stagione', available:5, photo:'https://images.unsplash.com/photo-1610209455607-89e8b3e0e393?w=600&h=900&fit=crop&auto=format', elements:['oscurità'] },
  { id:'ocean', name:'Tidal Forces', edition:'Edizione Acqua', count:5, colorA:'#001530', colorB:'#003060', accent:'#60a5fa', tag:'◆ Starter Deck Set', available:2, photo:'https://images.unsplash.com/photo-1590842605059-9dc85ef1ab73?w=600&h=900&fit=crop&auto=format', elements:['acqua'] },
]

function TearEdge({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 300 18" style={{ width:'100%', height:18, display:'block' }} preserveAspectRatio="none">
      <path d="M0 0 L12 14 L28 3 L40 16 L55 2 L68 15 L80 4 L95 17 L108 5 L120 16 L134 2 L148 14 L160 3 L175 16 L188 4 L200 17 L214 2 L228 15 L242 5 L255 16 L268 3 L282 14 L300 0" fill={accent + 'cc'} stroke={accent} strokeWidth="0.5" />
    </svg>
  )
}

export function PackOpening() {
  const [phase, setPhase] = useState<PackPhase>('select')
  const [selectedPack, setSelectedPack] = useState<PackType>(PACKS[0])
  const [drawnCards, setDrawnCards] = useState<Card[]>([])
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [cardVisible, setCardVisible] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [legendaryFlash, setLegendaryFlash] = useState(false)

  const [tearY, setTearY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [topGone, setTopGone] = useState(false)
  const packRef = useRef<HTMLDivElement>(null)

  const TEAR_THRESHOLD = 160
  const tearProgress = Math.min(1, tearY / TEAR_THRESHOLD)

  const drawCards = (): Card[] => {
    const pool = [...CATALOG]
    const result: Card[] = []
    const rares = pool.filter(c => c.rarity === 'leggendaria' || c.rarity === 'rara')
    const guaranteed = rares[Math.floor(Math.random() * rares.length)]
    result.push(guaranteed)
    const rest = pool.filter(c => c.id !== guaranteed.id)
    while (result.length < selectedPack.count) {
      const pick = rest[Math.floor(Math.random() * rest.length)]
      if (!result.find(c => c.id === pick.id)) result.push(pick)
    }
    return result.sort(() => Math.random() - 0.5)
  }

  const triggerOpen = () => {
    setTopGone(true)
    setTimeout(() => {
      const cards = drawCards()
      setDrawnCards(cards)
      setPhase('burst')
      setTimeout(() => {
        setPhase('cards')
        setCurrentCardIdx(0)
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
    if (currentCardIdx >= drawnCards.length - 1) { setShowSummary(true); return }
    setCardVisible(false)
    const isLeg = drawnCards[currentCardIdx + 1]?.rarity === 'leggendaria'
    if (isLeg) setLegendaryFlash(true)
    setTimeout(() => {
      setCurrentCardIdx(i => i + 1)
      setCardVisible(true)
      setTimeout(() => setLegendaryFlash(false), 800)
    }, 250)
  }

  const reset = () => {
    setPhase('select'); setDrawnCards([]); setCurrentCardIdx(0); setCardVisible(false)
    setShowSummary(false); setTearY(0); setTopGone(false); setLegendaryFlash(false)
  }

  const goToTear = () => { setTearY(0); setTopGone(false); setPhase('tear') }

  const currentCard = drawnCards[currentCardIdx]
  const el = currentCard ? ELEMENT_META[currentCard.element] : null
  const isLegendary = currentCard?.rarity === 'leggendaria'

  return (
    <div style={{ height:'calc(100vh - 64px)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {legendaryFlash && (
        <div style={{ position:'fixed', inset:0, zIndex:100, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.35) 0%, transparent 70%)', animation:'legendFlash 0.8s ease-out both' }} />
      )}

      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <div style={{ position:'absolute', inset:0, backgroundImage: phase === 'cards' && el ? undefined : `url(${selectedPack.photo})`, backgroundSize:'cover', backgroundPosition:'center', filter:'blur(3px) brightness(0.25)', transition:'all 0.8s ease' }} />
        <div style={{ position:'absolute', inset:0, background: phase === 'cards' && el ? `radial-gradient(ellipse 80% 60% at 50% 30%, ${el.color}22 0%, #06080f 70%)` : `radial-gradient(ellipse 70% 50% at 50% 30%, ${selectedPack.accent}18 0%, #06080f 65%)`, transition:'background 0.8s ease' }} />
        {Array.from({length:35}, (_,i) => (
          <div key={i} style={{ position:'absolute', left:`${(i*17.3)%100}%`, top:`${(i*13.7)%100}%`, width:i%6===0?2:1, height:i%6===0?2:1, borderRadius:'50%', background:`rgba(255,255,255,${0.08+(i%5)*0.07})` }} />
        ))}
        <div className="glow-orb" style={{ position:'absolute', left:'5%', top:'15%', width:500, height:500, background:`radial-gradient(circle, ${selectedPack.accent}14 0%, transparent 70%)`, borderRadius:'50%' }} />
        <div className="glow-orb" style={{ position:'absolute', right:'5%', bottom:'10%', width:400, height:400, background:`radial-gradient(circle, ${selectedPack.accent}10 0%, transparent 70%)`, borderRadius:'50%', animationDelay:'1.5s' }} />
      </div>

      {phase === 'select' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 24px', overflowY:'auto' }}>
          <div className="slide-up-1" style={{ textAlign:'center', marginBottom:32 }}>
            <div className="font-cinzel" style={{ fontSize:26, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
              <Icon.package style={{ width:26, height:26, color:'#f0a500' }} /> Sbustamento Pacchetti
            </div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.4)', marginTop:8 }}>Scegli l'edizione e strappa il tuo pacchetto</div>
          </div>
          <div className="slide-up-2" style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center', marginBottom:44 }}>
            {PACKS.map(pack => {
              const sel = selectedPack.id === pack.id
              return (
                <div key={pack.id} onClick={() => setSelectedPack(pack)} style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:140, height:200, borderRadius:14, position:'relative', overflow:'hidden',
                    border:`2px solid ${sel ? pack.accent : pack.accent+'30'}`,
                    boxShadow: sel ? `0 0 32px ${pack.accent}66, 0 20px 50px rgba(0,0,0,0.7)` : `0 10px 30px rgba(0,0,0,0.5)`,
                    transform: sel ? 'translateY(-8px) scale(1.05)' : 'none', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>
                    <img src={pack.photo} alt={pack.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45)' }} />
                    <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, transparent 40%, ${pack.colorA}ee 100%)` }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 50%)' }} />
                    <div style={{ position:'absolute', top:44, left:0, right:0, height:1, background:`repeating-linear-gradient(90deg, ${pack.accent}aa 0px, ${pack.accent}aa 6px, transparent 6px, transparent 12px)` }} />
                    <div className="font-cinzel" style={{ position:'absolute', top:22, left:0, right:0, textAlign:'center', fontSize:6.5, color:`${pack.accent}cc`, letterSpacing:'0.18em', textTransform:'uppercase' }}>✂ strappa qui</div>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'10px 10px 12px', textAlign:'center' }}>
                      <div className="font-cinzel-deco" style={{ fontSize:11, fontWeight:700, color:pack.accent, letterSpacing:'0.03em', textTransform:'uppercase', lineHeight:1.2 }}>{pack.name}</div>
                      <div style={{ fontSize:7.5, color:'rgba(232,220,200,0.5)', marginTop:3 }}>{pack.edition}</div>
                      {sel && <div style={{ marginTop:6, padding:'2px 10px', background:pack.accent, borderRadius:10, fontSize:7, color:'#06080f', fontFamily:'Cinzel,serif', fontWeight:700, letterSpacing:'0.06em', display:'inline-block' }}>SELEZIONATO</div>}
                    </div>
                    <div style={{ position:'absolute', top:8, right:8, padding:'2px 7px', background:'rgba(0,0,0,0.7)', border:`1px solid ${pack.accent}44`, borderRadius:8, fontSize:8, color:pack.accent, fontFamily:'Cinzel,serif' }}>×{pack.available}</div>
                  </div>
                  <div style={{ fontSize:9, color:'rgba(232,220,200,0.35)' }}>{pack.tag}</div>
                </div>
              )
            })}
          </div>
          <div className="slide-up-3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <button className="btn-primary font-cinzel badge-pulse" onClick={goToTear}
              style={{ padding:'18px 56px', borderRadius:14, background:`linear-gradient(135deg, ${selectedPack.accent}dd, ${selectedPack.colorB}cc)`, border:`1px solid ${selectedPack.accent}88`, color:'#06080f', fontSize:15, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', boxShadow:`0 10px 40px ${selectedPack.accent}55, 0 4px 12px rgba(0,0,0,0.5)` }}>
              <span style={{ display:'flex', alignItems:'center', gap:10 }}><Icon.zap style={{ width:18, height:18 }} /> Apri {selectedPack.name}</span>
            </button>
            <div style={{ fontSize:10, color:'rgba(232,220,200,0.25)' }}>{selectedPack.count} carte · {selectedPack.tag}</div>
          </div>
        </div>
      )}

      {phase === 'tear' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', userSelect:'none' }}>
          <div className="font-cinzel" style={{ position:'absolute', top:28, fontSize:12, color:`${selectedPack.accent}cc`, letterSpacing:'0.2em', textTransform:'uppercase', animation: tearProgress > 0.05 ? 'none' : 'badge-pulse 2s ease infinite', opacity: Math.max(0, 1 - tearProgress * 3), display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>☝</span> Trascina verso l'alto per strappare
          </div>
          <div style={{ position:'absolute', top:60, width:200, height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, width:`${tearProgress * 100}%`, background:`linear-gradient(90deg, ${selectedPack.accent}, ${selectedPack.accent}aa)`, transition:'width 0.05s linear', boxShadow:`0 0 8px ${selectedPack.accent}` }} />
          </div>
          <div ref={packRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            style={{ width:260, height:370, position:'relative', cursor: dragging ? 'grabbing' : 'grab', touchAction:'none', filter:`drop-shadow(0 0 40px ${selectedPack.accent}44)` }}>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${370 - 100}px`, borderRadius:'0 0 20px 20px', overflow:'hidden', boxShadow:`0 30px 80px rgba(0,0,0,0.9)` }}>
              <img src={selectedPack.photo} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.5)' }} />
              <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, rgba(0,0,0,0.4) 0%, ${selectedPack.colorA}cc 100%)` }} />
              <div style={{ position:'absolute', top:-1, left:0, right:0, zIndex:2 }}><TearEdge accent={selectedPack.accent} /></div>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, paddingTop:20 }}>
                <div className="font-cinzel-deco" style={{ fontSize:22, fontWeight:700, color:selectedPack.accent, letterSpacing:'0.04em', textTransform:'uppercase', textShadow:`0 0 20px ${selectedPack.accent}66` }}>{selectedPack.name}</div>
                <div className="font-cinzel" style={{ fontSize:9, color:'rgba(232,220,200,0.4)', letterSpacing:'0.2em', textTransform:'uppercase' }}>{selectedPack.edition}</div>
                <div style={{ marginTop:4, padding:'4px 14px', background:`${selectedPack.accent}22`, border:`1px solid ${selectedPack.accent}44`, borderRadius:20, fontSize:9, color:selectedPack.accent }}>{selectedPack.count} carte</div>
              </div>
              <div className="font-cinzel" style={{ position:'absolute', bottom:14, left:0, right:0, textAlign:'center', fontSize:8, color:`${selectedPack.accent}77`, letterSpacing:'0.12em' }}>{selectedPack.tag}</div>
            </div>
            {!topGone && (
              <div style={{ position:'absolute', top:0, left:0, right:0, height:110, borderRadius:'20px 20px 0 0', overflow:'hidden', transformOrigin:'50% 100%', transform:`translateY(${-tearProgress * 180}px) rotate(${tearProgress * -18}deg) scaleX(${1 - tearProgress * 0.3})`, opacity: 1 - tearProgress * 0.8, transition: dragging ? 'none' : 'transform 0.1s ease', zIndex:3 }}>
                <img src={selectedPack.photo} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', filter:'brightness(0.5)' }} />
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

      {phase === 'burst' && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle, ${selectedPack.accent}cc 0%, transparent 70%)`, animation:'burstPulse 0.7s ease-out both', filter:`blur(20px)` }} />
          {Array.from({length:16}, (_,i) => (
            <div key={i} style={{ position:'absolute', width: 4 + (i%3)*3, height: 4 + (i%3)*3, borderRadius:'50%', background: i%3===0 ? selectedPack.accent : i%3===1 ? '#ffd700' : 'white', animation:`burstParticle${i%4} 0.7s ease-out both`, left:'50%', top:'50%' }} />
          ))}
        </div>
      )}

      {phase === 'cards' && currentCard && !showSummary && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ position:'absolute', top:20, left:0, right:0, display:'flex', justifyContent:'center', gap:8 }}>
            {drawnCards.map((_,i) => {
              const isCurrent = i === currentCardIdx
              const isPast = i < currentCardIdx
              const c = drawnCards[i]
              return (
                <div key={i} style={{ width: isCurrent ? 32 : 8, height:8, borderRadius:4, background: isPast ? ELEMENT_META[c.element].color : isCurrent ? selectedPack.accent : 'rgba(255,255,255,0.12)', boxShadow: isCurrent ? `0 0 10px ${selectedPack.accent}` : 'none', transition:'all 0.3s ease' }} />
              )
            })}
          </div>
          {isLegendary && (
            <div style={{ position:'absolute', top:50, left:0, right:0, textAlign:'center', animation:'slide-up 0.5s ease both' }}>
              <div className="font-cinzel" style={{ fontSize:13, fontWeight:700, color:'#ffd700', letterSpacing:'0.2em', textTransform:'uppercase', textShadow:'0 0 20px #ffd700', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon.star style={{ width:16, height:16 }} /> Carta Leggendaria! <Icon.star style={{ width:16, height:16 }} />
              </div>
              {Array.from({length:20}, (_,i) => (
                <div key={i} className="particle" style={{ left:`${(i*5.3)%100}%`, top:0, width:3+i%3, height:3+i%3, background:'radial-gradient(circle, #ffd700 0%, transparent 70%)', animationDuration:`${1.5 + (i%3)*0.5}s`, animationDelay:`${(i*0.1)%1}s`, bottom:'auto' }} />
              ))}
            </div>
          )}
          <div style={{ transform: cardVisible ? 'scale(1) rotateY(0deg)' : 'scale(0.3) rotateY(90deg)', opacity: cardVisible ? 1 : 0, transition:'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease', marginTop: isLegendary ? 30 : 0 }}>
            <BigCard card={currentCard} />
          </div>
          <button onClick={nextCard} className="btn-primary font-cinzel"
            style={{ marginTop:28, padding:'13px 40px', borderRadius:12, background: currentCardIdx >= drawnCards.length - 1 ? 'linear-gradient(135deg,#f0a500,#d4842a)' : `linear-gradient(135deg, ${selectedPack.accent}cc, ${selectedPack.colorB}aa)`, border:'none', color:'#06080f', fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', boxShadow:`0 8px 28px ${selectedPack.accent}44`, opacity: cardVisible ? 1 : 0, transition:'opacity 0.4s ease 0.3s' }}>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
              {currentCardIdx >= drawnCards.length - 1 ? <><Icon.check style={{ width:14,height:14 }} /> Vedi Riepilogo</> : <><Icon.zap style={{ width:14,height:14 }} /> Prossima Carta ({currentCardIdx+2}/{drawnCards.length})</>}
            </span>
          </button>
        </div>
      )}

      {(phase === 'cards' && showSummary) && (
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 24px', overflowY:'auto', animation:'slide-up 0.6s ease both' }}>
          <div className="font-cinzel" style={{ fontSize:22, fontWeight:700, color:'#e8dcc8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6, textAlign:'center' }}>Pacchetto Aperto!</div>
          <div style={{ fontSize:12, color:'rgba(232,220,200,0.4)', marginBottom:28 }}>{selectedPack.name} · {selectedPack.edition}</div>
          <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap', justifyContent:'center' }}>
            {drawnCards.map((card, i) => {
              const elc = ELEMENT_META[card.element]
              const rarc = RARITY_META[card.rarity]
              const ElIconC = elc.Icon
              const isLeg2 = card.rarity === 'leggendaria'
              return (
                <div key={card.id} style={{ width:100, height:140, borderRadius:10, background:elc.bg, border:`1.5px solid ${rarc.color}${isLeg2?'cc':'55'}`, boxShadow: isLeg2 ? `0 0 20px ${elc.glow}` : `0 8px 20px rgba(0,0,0,0.5)`, position:'relative', overflow:'hidden', animation:`slide-up 0.5s ease ${i*0.1}s both` }}>
                  {isLeg2 && <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,215,0,0.08) 0%,transparent 50%)', animation:'shimmer 2s linear infinite' }} />}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%)' }} />
                  <div style={{ margin:'8px 8px 0', height:58, borderRadius:6, background:`radial-gradient(ellipse at 50% 40%, ${elc.color}28 0%, rgba(0,0,0,0.5) 70%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ElIconC style={{ width:30, height:30, color:elc.color, opacity:0.9 }} />
                  </div>
                  <div className="font-cinzel" style={{ padding:'4px 6px 2px', fontSize:7.5, fontWeight:700, color:rarc.color, letterSpacing:'0.03em', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
                  <div style={{ margin:'0 6px', padding:'1px 4px', background:'rgba(0,0,0,0.4)', borderRadius:2, fontSize:6, color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em', textTransform:'uppercase', display:'inline-block' }}>{card.type}</div>
                  <div style={{ position:'absolute', bottom:5, left:6, fontSize:6, color:rarc.color }}>{rarc.label}</div>
                  <div className="font-cinzel" style={{ position:'absolute', top:6, left:6, width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7.5, fontWeight:700, color:'#fff' }}>{card.cost}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', justifyContent:'center' }}>
            {(['leggendaria','rara','non comune','comune'] as Rarity[]).map(r => {
              const cnt = drawnCards.filter(c => c.rarity === r).length
              if (!cnt) return null
              const meta = RARITY_META[r]
              return (
                <div key={r} style={{ padding:'10px 18px', borderRadius:12, background:`${meta.color}12`, border:`1px solid ${meta.color}44`, textAlign:'center', minWidth:70 }}>
                  <div className="font-cinzel" style={{ fontSize:20, fontWeight:700, color:meta.color }}>{cnt}</div>
                  <div style={{ fontSize:8, color:'rgba(232,220,200,0.45)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{r}</div>
                </div>
              )
            })}
          </div>
          {drawnCards.some(c => c.rarity === 'leggendaria') && (
            <div style={{ marginBottom:20, padding:'12px 24px', background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.3)', borderRadius:12, textAlign:'center', animation:'badge-pulse 2s ease infinite' }}>
              <div className="font-cinzel" style={{ fontSize:12, color:'#ffd700', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:8 }}>
                <Icon.star style={{ width:14,height:14 }} /> Carta Leggendaria Ottenuta! <Icon.star style={{ width:14,height:14 }} />
              </div>
            </div>
          )}
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={reset} className="btn-primary font-cinzel" style={{ padding:'13px 36px', borderRadius:12, background:'linear-gradient(135deg,#f0a500,#d4842a)', border:'none', color:'#06080f', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', boxShadow:'0 8px 28px rgba(240,165,0,0.4)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}><Icon.package style={{ width:14,height:14 }} /> Apri un Altro</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

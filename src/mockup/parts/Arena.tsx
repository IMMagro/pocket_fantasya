import { useState, useRef } from 'react'
import { CATALOG, ELEMENT_META, RARITY_META, Icon } from '../NewUI'
import type { Card } from '../NewUI'

type BattlePhase = 'lobby' | 'battle'

interface FieldCard extends Card {
  fieldId: string
  currentHp: number
  canAttack: boolean
  stunned: boolean
}

function FieldCardTile({ card, side, isSelected, isTarget, isAttacking, onClick }: {
  card: FieldCard
  side: 'player' | 'opponent'
  isSelected?: boolean
  isTarget?: boolean
  isAttacking?: boolean
  onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  const el = ELEMENT_META[card.element]
  const rar = RARITY_META[card.rarity]
  const ElIcon = el.Icon

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} title={card.ability}
      style={{
        width: 88, height: 118, borderRadius: 10, background: el.bg,
        border: `1.5px solid ${isSelected ? '#f0a500cc' : isTarget && hov ? 'rgba(248,113,113,0.8)' : hov ? rar.color+'99' : rar.color+'44'}`,
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        transform: `${isAttacking ? (side === 'player' ? 'translateY(-14px) scale(1.06)' : 'translateY(14px) scale(1.06)') : isSelected ? 'scale(1.1) translateY(-6px)' : hov ? 'scale(1.04) translateY(-2px)' : 'scale(1)'}`,
        boxShadow: isSelected ? `0 0 24px rgba(240,165,0,0.7), 0 16px 36px rgba(0,0,0,0.8)` : isTarget && hov ? `0 0 20px rgba(248,113,113,0.6), 0 12px 28px rgba(0,0,0,0.7)` : `0 0 10px ${el.glow}44, 0 8px 20px rgba(0,0,0,0.6)`,
        filter: card.stunned ? 'brightness(0.45) saturate(0)' : !card.canAttack && side === 'player' ? 'brightness(0.75)' : 'none',
        flexShrink: 0,
      }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%)', pointerEvents:'none' }} />
      <div className="font-cinzel" style={{ position:'absolute', top:4, left:4, width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', boxShadow:'0 0 6px rgba(59,130,246,0.6)', zIndex:2 }}>{card.cost}</div>
      {side === 'player' && card.canAttack && !card.stunned && (
        <div style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:'50%', background:'#f0a500', boxShadow:'0 0 8px rgba(240,165,0,0.9)', animation:'badge-pulse 1.5s ease infinite', zIndex:2 }} />
      )}
      <div style={{ margin:'6px 6px 0', height:52, borderRadius:6, background:`radial-gradient(ellipse at 50% 40%, ${el.color}28 0%, rgba(0,0,0,0.5) 70%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <ElIcon style={{ width:28, height:28, color:el.color, opacity:0.9 }} />
      </div>
      <div className="font-cinzel" style={{ padding:'3px 5px 1px', fontSize:6, fontWeight:700, color:el.color, letterSpacing:'0.03em', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
      {card.type === 'Creatura' && (
        <div style={{ margin:'2px 5px', height:2, background:'rgba(0,0,0,0.5)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(card.currentHp / card.hp) * 100}%`, background: card.currentHp < card.hp * 0.4 ? '#f87171' : '#4ade80', borderRadius:2, transition:'width 0.4s ease' }} />
        </div>
      )}
      {card.type === 'Creatura' && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', justifyContent:'space-between', padding:'3px 6px', background:'rgba(0,0,0,0.65)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:2, fontSize:8, color:'#f87171', fontWeight:700 }}><Icon.sword style={{ width:7, height:7 }} />{card.atk}</div>
          <div style={{ fontSize:8, fontWeight:700, color: card.currentHp < card.hp * 0.4 ? '#f87171' : '#4ade80', display:'flex', alignItems:'center', gap:1 }}>{card.currentHp}<Icon.shield style={{ width:6, height:6 }} /></div>
        </div>
      )}
      {isTarget && hov && side === 'opponent' && (
        <div style={{ position:'absolute', inset:0, borderRadius:10, background:'rgba(248,113,113,0.14)', border:'1.5px solid rgba(248,113,113,0.7)' }} />
      )}
    </div>
  )
}

export function ArenaBattaglia() {
  const [phase, setPhase] = useState<BattlePhase>('lobby')
  const [playerHP, setPlayerHP] = useState(30)
  const [opponentHP, setOpponentHP] = useState(30)
  const [turn, setTurn] = useState(1)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [maxMana, setMaxMana] = useState(1)
  const [currentMana, setCurrentMana] = useState(1)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [playerField, setPlayerField] = useState<FieldCard[]>([])
  const [opponentField, setOpponentField] = useState<FieldCard[]>([])
  const [gameLog, setGameLog] = useState<string[]>([])
  const [selectedHandId, setSelectedHandId] = useState<string | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null)
  const [playerDamageFlash, setPlayerDamageFlash] = useState(false)
  const [opponentDamageFlash, setOpponentDamageFlash] = useState(false)
  const [attackingId, setAttackingId] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const opponentFieldRef = useRef<FieldCard[]>([])
  opponentFieldRef.current = opponentField

  const addLog = (msg: string) => {
    setGameLog(prev => [...prev, msg])
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, 50)
  }

  const startBattle = () => {
    const shuffled = [...CATALOG].sort(() => Math.random() - 0.5)
    setPlayerHand(shuffled.slice(0, 4))
    setPlayerField([]); setOpponentField([])
    setPlayerHP(30); setOpponentHP(30)
    setTurn(1); setMaxMana(1); setCurrentMana(1)
    setIsPlayerTurn(true); setWinner(null)
    setSelectedHandId(null); setSelectedFieldId(null)
    setGameLog(['⚔️ La partita ha inizio! Turno 1 — È il tuo turno.'])
    setPhase('battle')
  }

  const playCard = (card: Card) => {
    if (!isPlayerTurn || currentMana < card.cost || playerField.length >= 7) return
    const isSpell = card.type === 'Incantesimo' || card.type === 'Trappola'
    if (!isSpell) {
      const fc: FieldCard = { ...card, fieldId: `pf-${Date.now()}-${card.id}`, currentHp: card.hp, canAttack: false, stunned: false }
      setPlayerField(prev => [...prev, fc])
    }
    setPlayerHand(prev => prev.filter(c => c.id !== card.id))
    setCurrentMana(prev => prev - card.cost)
    setSelectedHandId(null)
    addLog(`Hai evocato ${card.name}!`)
    if (isSpell) {
      if (card.element === 'fuoco') {
        const dmg = 6
        setOpponentHP(prev => { const n = Math.max(0, prev - dmg); if (n <= 0) setWinner('player'); return n })
        setOpponentDamageFlash(true); setTimeout(() => setOpponentDamageFlash(false), 500)
        addLog(`${card.name} infligge ${dmg} danni all'eroe nemico!`)
      } else if (card.element === 'acqua') {
        setOpponentField(prev => { const t = prev[0]; if (!t) return prev; addLog(`${card.name} congela ${t.name}!`); return prev.map((fc,i) => i===0 ? {...fc, stunned:true} : fc) })
      } else if (card.element === 'fulmine') {
        setOpponentField(prev => { addLog('Tempesta infligge 4 danni a tutti i nemici!'); return prev.map(fc => ({...fc, currentHp: fc.currentHp-4})).filter(fc => fc.currentHp > 0) })
      } else if (card.element === 'oscurità') {
        addLog('Invocazione Oscura ripristina una creatura!')
      }
    }
  }

  const attackWithCard = (attackerId: string, targetId: string) => {
    const attacker = playerField.find(fc => fc.fieldId === attackerId)
    if (!attacker || !attacker.canAttack || attacker.stunned) return
    setAttackingId(attackerId)
    setTimeout(() => setAttackingId(null), 500)
    setSelectedFieldId(null)
    if (targetId === 'hero') {
      const dmg = attacker.atk
      setOpponentHP(prev => { const n = Math.max(0, prev - dmg); if (n <= 0) setWinner('player'); return n })
      setOpponentDamageFlash(true); setTimeout(() => setOpponentDamageFlash(false), 500)
      addLog(`${attacker.name} attacca l'eroe nemico per ${dmg}!`)
    } else {
      const target = opponentField.find(fc => fc.fieldId === targetId)
      if (!target) return
      addLog(`${attacker.name} (${attacker.atk}) vs ${target.name} (${target.atk})`)
      const newAtkHp = attacker.currentHp - target.atk
      const newTgtHp = target.currentHp - attacker.atk
      setPlayerField(prev => prev.map(fc => fc.fieldId === attackerId ? {...fc, currentHp: newAtkHp, canAttack: false} : fc).filter(fc => fc.currentHp > 0))
      setOpponentField(prev => prev.map(fc => fc.fieldId === targetId ? {...fc, currentHp: newTgtHp} : fc).filter(fc => fc.currentHp > 0))
      if (newAtkHp <= 0) addLog(`${attacker.name} è stato distrutto!`)
      if (newTgtHp <= 0) addLog(`${target.name} è stato distrutto!`)
    }
    setPlayerField(prev => prev.map(fc => fc.fieldId === attackerId ? {...fc, canAttack: false} : fc))
  }

  const endTurn = () => {
    if (!isPlayerTurn) return
    setIsPlayerTurn(false); setSelectedHandId(null); setSelectedFieldId(null)
    addLog('Hai terminato il turno.')
    const newTurn = turn + 1
    const newMax = Math.min(10, newTurn)
    setTurn(newTurn)
    setTimeout(() => {
      const aiCard = CATALOG.filter(c => c.cost <= newMax && (c.type === 'Creatura')).sort(() => Math.random() - 0.5)[0]
      if (aiCard && opponentFieldRef.current.length < 7) {
        const fc: FieldCard = { ...aiCard, fieldId: `ef-${Date.now()}`, currentHp: aiCard.hp, canAttack: true, stunned: false }
        setOpponentField(prev => [...prev, fc])
        addLog(`L'avversario evoca ${aiCard.name}!`)
      }
      setTimeout(() => {
        const attackers = opponentFieldRef.current.filter(fc => !fc.stunned)
        const totalDmg = attackers.reduce((sum, fc) => sum + fc.atk, 0)
        if (totalDmg > 0) {
          setPlayerHP(prev => { const n = Math.max(0, prev - totalDmg); if (n <= 0) setWinner('opponent'); return n })
          setPlayerDamageFlash(true); setTimeout(() => setPlayerDamageFlash(false), 500)
          attackers.forEach(fc => addLog(`${fc.name} attacca il tuo eroe per ${fc.atk}!`))
        }
        setOpponentField(prev => prev.map(fc => ({...fc, stunned: false})))
        setTimeout(() => {
          setMaxMana(newMax); setCurrentMana(newMax)
          setPlayerField(prev => prev.map(fc => ({...fc, canAttack: true})))
          const draw = CATALOG[Math.floor(Math.random() * CATALOG.length)]
          setPlayerHand(prev => prev.length < 10 ? [...prev, draw] : prev)
          addLog(`Turno ${newTurn + 1} — È il tuo turno!`)
          setIsPlayerTurn(true)
        }, 900)
      }, 900)
    }, 600)
  }

  if (phase === 'lobby') {
    return (
      <div style={{ position:'relative', height:'calc(100vh - 64px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 100% 55% at 50% 0%, rgba(200,50,15,0.22) 0%, transparent 60%)' }} />
          <div className="glow-orb" style={{ position:'absolute', left:'10%', top:'15%', width:600, height:600, background:'radial-gradient(circle, rgba(240,80,20,0.14) 0%, transparent 65%)', borderRadius:'50%' }} />
          <div className="glow-orb" style={{ position:'absolute', right:'8%', top:'25%', width:500, height:500, background:'radial-gradient(circle, rgba(120,30,220,0.1) 0%, transparent 65%)', borderRadius:'50%', animationDelay:'1.5s' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(240,165,0,0.06) 0%, transparent 70%)' }} />
        </div>
        <div style={{ animation:'slide-up 0.55s ease both', textAlign:'center', marginBottom:48, position:'relative', zIndex:2 }}>
          <div className="font-cinzel" style={{ fontSize:10, letterSpacing:'0.5em', color:'rgba(240,165,0,0.5)', textTransform:'uppercase', marginBottom:18 }}>Pocket Fantasya</div>
          <h2 className="font-cinzel-deco" style={{ fontSize:'clamp(30px,5vw,60px)', fontWeight:700, margin:0, background:'linear-gradient(135deg, #f87171 0%, #f0a500 45%, #fde68a 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'0.04em' }}>Arena di Battaglia</h2>
          <div style={{ marginTop:12, fontSize:13, color:'rgba(232,220,200,0.4)' }}>Scegli la tua modalità di combattimento</div>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', justifyContent:'center', animation:'slide-up 0.55s ease 0.12s both', position:'relative', zIndex:2 }}>
          <button onClick={startBattle}
            style={{ width:240, padding:'28px 24px', textAlign:'left', background:'linear-gradient(145deg, rgba(200,60,20,0.14) 0%, rgba(13,17,32,0.95) 100%)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:16, cursor:'pointer', transition:'all 0.25s ease', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.65)'; e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 20px 60px rgba(248,113,113,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.3)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 50%)', pointerEvents:'none' }} />
            <div style={{ width:48, height:48, borderRadius:12, marginBottom:16, background:'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(200,40,40,0.28))', border:'1px solid rgba(248,113,113,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon.bot style={{ width:24, height:24, color:'#f87171' }} />
            </div>
            <div className="font-cinzel" style={{ fontSize:14, fontWeight:700, color:'#f87171', marginBottom:8, letterSpacing:'0.05em' }}>Sfida l'IA</div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.5)', lineHeight:1.55, marginBottom:18 }}>Allenati contro un avversario controllato dal computer. Subito disponibile.</div>
            <div style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, background:'rgba(248,113,113,0.15)', border:'1px solid rgba(248,113,113,0.3)', fontSize:9, color:'#f87171', fontFamily:'Cinzel,serif', letterSpacing:'0.1em' }}>DISPONIBILE</div>
          </button>
          <button style={{ width:240, padding:'28px 24px', textAlign:'left', background:'linear-gradient(145deg, rgba(96,165,250,0.06) 0%, rgba(13,17,32,0.95) 100%)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:16, cursor:'not-allowed', opacity:0.55 }}>
            <div style={{ width:48, height:48, borderRadius:12, marginBottom:16, background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon.trophy style={{ width:24, height:24, color:'#60a5fa' }} />
            </div>
            <div className="font-cinzel" style={{ fontSize:14, fontWeight:700, color:'#60a5fa', marginBottom:8, letterSpacing:'0.05em' }}>PvP Online</div>
            <div style={{ fontSize:12, color:'rgba(232,220,200,0.4)', lineHeight:1.55, marginBottom:18 }}>Sfida altri giocatori in tempo reale in ranked e casual.</div>
            <div style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.18)', fontSize:9, color:'rgba(96,165,250,0.5)', fontFamily:'Cinzel,serif', letterSpacing:'0.1em' }}>PROSSIMAMENTE</div>
          </button>
        </div>
      </div>
    )
  }

  if (winner) {
    return (
      <div style={{ position:'relative', height:'calc(100vh - 64px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', inset:0, background: winner === 'player' ? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,215,0,0.1) 0%, transparent 65%)' : 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(248,113,113,0.1) 0%, transparent 65%)' }} />
        </div>
        <div style={{ textAlign:'center', animation:'slide-up 0.6s ease both', position:'relative', zIndex:2 }}>
          <div className="font-cinzel-deco" style={{ fontSize:'clamp(40px,6vw,72px)', fontWeight:700, color: winner === 'player' ? '#ffd700' : '#f87171', textShadow: winner === 'player' ? '0 0 60px rgba(255,215,0,0.55)' : '0 0 60px rgba(248,113,113,0.45)', marginBottom:12 }}>
            {winner === 'player' ? 'Vittoria!' : 'Sconfitta'}
          </div>
          <div style={{ fontSize:14, color:'rgba(232,220,200,0.5)', marginBottom:36 }}>{winner === 'player' ? "Hai sconfitto l'avversario!" : 'Meglio la prossima volta...'}</div>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={startBattle} className="btn-primary font-cinzel" style={{ padding:'13px 36px', borderRadius:12, background:'linear-gradient(135deg,#f0a500,#d4842a)', border:'none', color:'#06080f', fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', boxShadow:'0 8px 28px rgba(240,165,0,0.4)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:8 }}><Icon.sword style={{ width:13,height:13 }} /> Rivincita</span>
            </button>
            <button onClick={() => setPhase('lobby')} className="font-cinzel" style={{ padding:'13px 28px', borderRadius:12, background:'transparent', border:'1px solid rgba(240,165,0,0.3)', color:'rgba(232,220,200,0.6)', fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>Lobby</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height:'calc(100vh - 64px)', display:'flex', overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 130% 45% at 50% 0%, rgba(200,50,15,0.22) 0%, transparent 55%), radial-gradient(ellipse 130% 45% at 50% 100%, rgba(20,60,200,0.14) 0%, transparent 55%), linear-gradient(180deg, rgba(50,10,5,0.45) 0%, rgba(6,8,15,0.96) 25%, rgba(6,8,15,0.96) 75%, rgba(5,12,50,0.45) 100%)` }} />
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'linear-gradient(90deg, transparent 0%, rgba(240,165,0,0.3) 30%, rgba(240,165,0,0.5) 50%, rgba(240,165,0,0.3) 70%, transparent 100%)', transform:'translateY(-50%)' }} />
        <div className="glow-orb" style={{ position:'absolute', left:'50%', top:'-5%', transform:'translateX(-50%)', width:700, height:280, background:'radial-gradient(ellipse, rgba(248,113,113,0.12) 0%, transparent 65%)', borderRadius:'50%' }} />
        <div className="glow-orb" style={{ position:'absolute', left:'50%', bottom:'-5%', transform:'translateX(-50%)', width:700, height:280, background:'radial-gradient(ellipse, rgba(96,165,250,0.1) 0%, transparent 65%)', borderRadius:'50%', animationDelay:'2s' }} />
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} style={{ position:'absolute', left:`${(i * 23.7) % 100}%`, bottom:`${18 + (i * 11.3) % 65}%`, width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2, borderRadius:'50%', background: i % 3 === 0 ? 'rgba(240,165,0,0.55)' : i % 3 === 1 ? 'rgba(248,113,113,0.45)' : 'rgba(96,165,250,0.4)', animation:`particle-rise ${3 + (i % 5)}s ${i * 0.35}s linear infinite` }} />
        ))}
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:2, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 16px', flexShrink:0, background:'rgba(6,8,15,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(240,165,0,0.07)' }}>
          <button onClick={() => setPhase('lobby')} style={{ padding:'5px 14px', borderRadius:8, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', color:'#f87171', cursor:'pointer', fontSize:10, fontFamily:'Cinzel,serif', letterSpacing:'0.06em' }}>← Abbandona</button>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="font-cinzel" style={{ fontSize:10, color:'rgba(232,220,200,0.35)', letterSpacing:'0.12em' }}>TURNO {turn}</div>
            <div style={{ padding:'5px 18px', borderRadius:20, background: isPlayerTurn ? 'linear-gradient(135deg,rgba(96,165,250,0.2),rgba(59,130,246,0.1))' : 'linear-gradient(135deg,rgba(248,113,113,0.2),rgba(200,60,20,0.1))', border:`1px solid ${isPlayerTurn ? 'rgba(96,165,250,0.4)' : 'rgba(248,113,113,0.4)'}`, fontSize:10, fontFamily:'Cinzel,serif', fontWeight:700, color: isPlayerTurn ? '#60a5fa' : '#f87171', letterSpacing:'0.08em' }}>
              {isPlayerTurn ? '⚔ IL TUO TURNO' : '⏳ AVVERSARIO'}
            </div>
          </div>
          <div style={{ fontSize:10, color:'rgba(232,220,200,0.25)' }}>Mazzo: {Math.max(0, 30 - turn * 2)} carte</div>
        </div>

        <div style={{ display:'flex', alignItems:'center', padding:'10px 16px', flexShrink:0, background:`rgba(248,113,113,${opponentDamageFlash ? '0.18' : '0.04'})`, borderBottom:'1px solid rgba(248,113,113,0.1)', transition:'background 0.25s ease' }}>
          <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, marginRight:12, background:'linear-gradient(135deg,#3d0a0a,#6b1010)', border:`2px solid ${opponentDamageFlash ? '#f87171' : 'rgba(248,113,113,0.45)'}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 ${opponentDamageFlash ? '28px' : '10px'} rgba(248,113,113,0.35)`, transition:'all 0.25s ease' }}>
            <Icon.bot style={{ width:22, height:22, color:'#f87171' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
              <div className="font-cinzel" style={{ fontSize:11, color:'#f87171', letterSpacing:'0.06em' }}>AI Bot Arena</div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#f87171', fontWeight:700 }}><Icon.shield style={{ width:11, height:11 }} />{opponentHP} / 30</div>
            </div>
            <div style={{ height:5, background:'rgba(248,113,113,0.12)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(opponentHP/30)*100}%`, background:'linear-gradient(90deg,#dc2626,#f87171)', borderRadius:3, transition:'width 0.5s ease', boxShadow:'0 0 8px rgba(248,113,113,0.4)' }} />
            </div>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 16px', borderBottom:'1px solid rgba(240,165,0,0.05)', minHeight:0, cursor: selectedFieldId ? 'crosshair' : 'default' }}
          onClick={() => { if (selectedFieldId && opponentField.length === 0) { attackWithCard(selectedFieldId, 'hero') } }}>
          {opponentField.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'rgba(232,220,200,0.1)', fontSize:11, border:`1px dashed ${selectedFieldId ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.05)'}`, borderRadius:12, padding:'14px 40px', background: selectedFieldId ? 'rgba(248,113,113,0.05)' : 'transparent', transition:'all 0.2s ease' }}>
              {selectedFieldId ? 'Clicca qui per attaccare l\'eroe!' : 'Nessuna creatura in campo'}
            </div>
          ) : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              {opponentField.map(fc => (
                <FieldCardTile key={fc.fieldId} card={fc} side="opponent" isTarget={!!selectedFieldId} isAttacking={attackingId === fc.fieldId} onClick={() => { if (selectedFieldId) attackWithCard(selectedFieldId, fc.fieldId) }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', padding:'7px 16px', flexShrink:0, gap:16 }}>
          <div style={{ flex:1, height:1, background:'linear-gradient(90deg, transparent, rgba(240,165,0,0.2), transparent)' }} />
          <button onClick={endTurn} disabled={!isPlayerTurn} className="font-cinzel"
            style={{ padding:'8px 24px', borderRadius:20, flexShrink:0, background: isPlayerTurn ? 'linear-gradient(135deg,#f0a500,#d4842a)' : 'rgba(13,17,32,0.8)', border: isPlayerTurn ? 'none' : '1px solid rgba(240,165,0,0.12)', color: isPlayerTurn ? '#06080f' : 'rgba(232,220,200,0.2)', cursor: isPlayerTurn ? 'pointer' : 'not-allowed', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', boxShadow: isPlayerTurn ? '0 4px 20px rgba(240,165,0,0.35)' : 'none', transition:'all 0.25s ease' }}>Fine Turno →</button>
          <div style={{ flex:1, height:1, background:'linear-gradient(90deg, transparent, rgba(240,165,0,0.2), transparent)' }} />
        </div>

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 16px', borderTop:'1px solid rgba(96,165,250,0.05)', minHeight:0 }}>
          {playerField.length === 0 ? (
            <div style={{ color:'rgba(232,220,200,0.1)', fontSize:11, border:'1px dashed rgba(255,255,255,0.05)', borderRadius:12, padding:'14px 40px' }}>
              {isPlayerTurn ? 'Gioca una carta per evocarla' : 'Campo vuoto'}
            </div>
          ) : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              {playerField.map(fc => (
                <FieldCardTile key={fc.fieldId} card={fc} side="player" isSelected={selectedFieldId === fc.fieldId} isAttacking={attackingId === fc.fieldId}
                  onClick={() => { if (!isPlayerTurn) return; if (fc.canAttack && !fc.stunned) setSelectedFieldId(prev => prev === fc.fieldId ? null : fc.fieldId); else setSelectedFieldId(null) }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', padding:'10px 16px', flexShrink:0, background:`rgba(96,165,250,${playerDamageFlash ? '0.18' : '0.04'})`, borderTop:'1px solid rgba(96,165,250,0.1)', transition:'background 0.25s ease' }}>
          <div style={{ display:'flex', gap:4, marginRight:14, flexShrink:0 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: i < currentMana ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : i < maxMana ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)', border: i < maxMana ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.05)', boxShadow: i < currentMana ? '0 0 6px rgba(59,130,246,0.55)' : 'none', transition:'all 0.3s ease', flexShrink:0 }} />
            ))}
            <div style={{ marginLeft:5, fontSize:9, color:'#60a5fa', fontFamily:'Cinzel,serif', fontWeight:700, alignSelf:'center' }}>{currentMana}/{maxMana}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
              <div className="font-cinzel" style={{ fontSize:11, color:'#60a5fa', letterSpacing:'0.06em' }}>Giocatore 1 (Tu)</div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#4ade80', fontWeight:700 }}><Icon.shield style={{ width:11, height:11 }} />{playerHP} / 30</div>
            </div>
            <div style={{ height:5, background:'rgba(74,222,128,0.1)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(playerHP/30)*100}%`, background:'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius:3, transition:'width 0.5s ease', boxShadow:'0 0 8px rgba(74,222,128,0.4)' }} />
            </div>
          </div>
          <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, marginLeft:12, background:'linear-gradient(135deg,#0a1f3d,#193766)', border:`2px solid ${playerDamageFlash ? '#60a5fa' : 'rgba(96,165,250,0.45)'}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 ${playerDamageFlash ? '28px' : '10px'} rgba(96,165,250,0.35)`, transition:'all 0.25s ease' }}>
            <Icon.wizard style={{ width:22, height:22, color:'#60a5fa' }} />
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'8px 16px 6px', flexShrink:0, gap:6, flexWrap:'wrap', background:'rgba(6,8,15,0.7)', backdropFilter:'blur(8px)', borderTop:'1px solid rgba(240,165,0,0.06)', minHeight:100 }}>
          {playerHand.length === 0 && <div style={{ alignSelf:'center', fontSize:11, color:'rgba(232,220,200,0.15)' }}>Mano vuota — Pesca al prossimo turno</div>}
          {playerHand.map((card, i) => {
            const isSelected = selectedHandId === card.id + i
            const canPlay = isPlayerTurn && currentMana >= card.cost
            const el = ELEMENT_META[card.element]
            const rar = RARITY_META[card.rarity]
            const ElIcon = el.Icon
            const fanAngle = playerHand.length > 1 ? (i - (playerHand.length - 1) / 2) * 5 : 0
            const fanLift = Math.abs(i - (playerHand.length - 1) / 2) * 3
            return (
              <div key={card.id + i}
                onClick={() => { if (!canPlay) return; if (isSelected) { playCard(card); setSelectedHandId(null) } else setSelectedHandId(card.id + i) }}
                style={{ width:78, height:110, borderRadius:8, flexShrink:0, background:el.bg, border:`1.5px solid ${isSelected ? '#f0a500cc' : canPlay ? rar.color+'55' : 'rgba(255,255,255,0.06)'}`, position:'relative', overflow:'hidden', cursor: canPlay ? 'pointer' : 'not-allowed', transform:`rotate(${fanAngle}deg) translateY(${isSelected ? -24 : fanLift + 14}px) scale(${isSelected ? 1.12 : 1})`, transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: isSelected ? `0 0 22px ${el.glow}, 0 20px 40px rgba(0,0,0,0.85)` : canPlay ? `0 0 8px ${el.glow}44, 0 8px 18px rgba(0,0,0,0.65)` : '0 4px 12px rgba(0,0,0,0.65)', filter: canPlay ? 'none' : 'brightness(0.45)', marginBottom: -18, zIndex: isSelected ? 10 : playerHand.length - i }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 50%)', pointerEvents:'none' }} />
                <div className="font-cinzel" style={{ position:'absolute', top:4, left:4, width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', boxShadow:'0 0 6px rgba(59,130,246,0.6)', zIndex:2 }}>{card.cost}</div>
                <div style={{ margin:'5px 5px 0', height:46, borderRadius:5, background:`radial-gradient(ellipse at 50% 40%, ${el.color}28 0%, rgba(0,0,0,0.5) 70%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ElIcon style={{ width:22, height:22, color:el.color, opacity:0.9 }} />
                </div>
                <div className="font-cinzel" style={{ padding:'3px 5px 1px', fontSize:5.5, fontWeight:700, color:el.color, letterSpacing:'0.03em', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
                {card.type === 'Creatura' && (
                  <div style={{ position:'absolute', bottom:4, left:5, right:5, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:7, color:'#f87171', fontWeight:700 }}>{card.atk}⚔</span>
                    <span style={{ fontSize:7, color:'#4ade80', fontWeight:700 }}>{card.hp}♥</span>
                  </div>
                )}
                {isSelected && (
                  <div style={{ position:'absolute', inset:0, borderRadius:8, background:'rgba(240,165,0,0.12)', border:'1.5px solid rgba(240,165,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ fontSize:7, color:'#f0a500', fontFamily:'Cinzel,serif', fontWeight:700, textAlign:'center', padding:'0 4px', lineHeight:1.5 }}>Clicca ancora<br/>per giocare</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ width:210, flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(6,8,15,0.94)', borderLeft:'1px solid rgba(240,165,0,0.07)', zIndex:2 }}>
        <div className="font-cinzel" style={{ padding:'11px 14px', borderBottom:'1px solid rgba(240,165,0,0.07)', fontSize:9, letterSpacing:'0.14em', color:'rgba(232,220,200,0.35)' }}>REGISTRO BATTAGLIA</div>
        <div ref={logRef} style={{ flex:1, overflowY:'auto', padding:'10px 14px', display:'flex', flexDirection:'column', gap:5 }}>
          {gameLog.map((entry, i) => (
            <div key={i} style={{ fontSize:10, lineHeight:1.55, color: i === gameLog.length - 1 ? '#e8dcc8' : 'rgba(232,220,200,0.4)', borderLeft: i === gameLog.length - 1 ? '2px solid rgba(240,165,0,0.45)' : '2px solid transparent', paddingLeft:7, animation: i === gameLog.length - 1 ? 'fadeIn 0.3s ease' : 'none' }}>{entry}</div>
          ))}
        </div>
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(240,165,0,0.07)', fontSize:9, color:'rgba(232,220,200,0.25)', lineHeight:1.7 }}>
          <div style={{ color:'rgba(240,165,0,0.6)', fontFamily:'Cinzel,serif', fontSize:8, marginBottom:5, letterSpacing:'0.08em' }}>COME GIOCARE</div>
          · Clicca 2x una carta per giocarla<br/>
          · Seleziona creatura → attacca nemico<br/>
          · Il punto oro = può attaccare
        </div>
      </div>
    </div>
  )
}

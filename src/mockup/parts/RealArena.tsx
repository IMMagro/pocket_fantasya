import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Icon } from '../NewUI'
import { createInitialGameState, playCard, attackTarget, endTurn } from '../../engine/gameEngine'
import { executeAiTurn } from '../../engine/aiBot'
import { soundEngine } from '../../engine/soundEngine'

// Le carte del gioco sono SOLO quelle create da te nel Card Creator Studio,
// pubblicate sul server. Niente carte di default.
const SERVER_URL = 'http://localhost:4000'

// Mappa rarità delle carte REALI (common/rare/epic/legendary/mythic) al look nuovo
const REAL_RARITY: Record<string, { color: string; label: string }> = {
  common:    { color: '#9ca3af', label: '· COMUNE' },
  rare:      { color: '#60a5fa', label: '● RARA' },
  epic:      { color: '#c084fc', label: '◆ EPICA' },
  legendary: { color: '#ffd700', label: '★ LEGGENDARIA' },
  mythic:    { color: '#f87171', label: '✦ MITICA' },
}
const rarInfo = (r: string) => REAL_RARITY[r] || REAL_RARITY.common

// ── Tile creatura sul campo ───────────────────────────────────────────────────
function BoardMinion({ minion, side, selectable, isSelected, isTarget, onClick }: any) {
  const [hov, setHov] = useState(false)
  const lowHp = minion.currentHp < minion.hp * 0.4

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} title={minion.abilityText}
      style={{
        width: 104, height: 142, borderRadius: 12,
        backgroundColor: '#FAF7EE',
        backgroundImage: 'linear-gradient(180deg, #FAF7EE 0%, #F5F1E6 100%)',
        border: `2px solid ${isSelected ? '#f0a500' : isTarget && hov ? '#dc2626' : hov ? '#6C8D88' : '#D1C9B8'}`,
        position: 'relative', overflow: 'hidden',
        cursor: (selectable || isTarget) ? 'pointer' : 'default',
        transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        transform: isSelected ? 'scale(1.1) translateY(-6px)' : hov && (selectable || isTarget) ? 'scale(1.05) translateY(-3px)' : 'scale(1)',
        boxShadow: isSelected ? '0 0 24px rgba(240,165,0,0.7), 0 16px 34px rgba(0,0,0,0.5)' : isTarget && hov ? '0 0 20px rgba(220,38,38,0.6)' : `0 4px 14px rgba(0,0,0,0.25)`,
        filter: !minion.canAttack && side === 'player' && !isTarget ? 'brightness(0.85)' : 'none',
        flexShrink: 0,
        color: '#192523',
      }}>
      {/* Hanging Slate-Teal Ribbon */}
      <div style={{
        position: 'absolute', top: 0, left: 6, width: 18, height: 32,
        background: 'linear-gradient(180deg, #5E807B 0%, #6C8D88 100%)',
        borderRadius: '0 0 9px 9px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 2, zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
      }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 10, color: '#fff', lineHeight: 1 }}>{minion.cost}</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1px solid #fff', marginTop: 'auto', marginBottom: 3 }} />
      </div>

      {minion.hasTaunt && (
        <div title="GUARDIANO" style={{ position: 'absolute', top: 4, right: 4, zIndex: 5, width: 18, height: 18, borderRadius: 4, background: '#6C8D88', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
          <Icon.shield style={{ width: 10, height: 10, color: '#FAF7EE' }} />
        </div>
      )}
      {side === 'player' && minion.canAttack && (
        <div style={{ position: 'absolute', top: 4, right: minion.hasTaunt ? 26 : 4, zIndex: 5, width: 8, height: 8, borderRadius: '50%', background: '#f0a500', boxShadow: '0 0 8px rgba(240,165,0,0.9)', animation: 'badge-pulse 1.5s ease infinite' }} />
      )}

      {/* Creature Artwork */}
      <div style={{ height: 80, margin: '4px', marginTop: 2, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {minion.imageUrl
          ? <img src={minion.imageUrl} alt={minion.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <Icon.sword style={{ width: 32, height: 32, color: '#6C8D88' }} />}
      </div>

      <div className="font-cinzel" style={{ padding: '0 6px', fontSize: 8, fontWeight: 800, color: '#192523', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
        {minion.name}
      </div>

      {/* HP health bar */}
      <div style={{ margin: '2px 6px', height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, (minion.currentHp / minion.hp) * 100)}%`, background: lowHp ? '#dc2626' : '#16a34a', transition: 'width 0.4s ease' }} />
      </div>

      {/* ATK & HP Badges */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '2px 6px', background: 'rgba(46,63,60,0.08)', borderTop: '1px solid rgba(46,63,60,0.1)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#192523', fontWeight: 800, fontFamily: 'Cinzel, serif' }}>
          <Icon.sword style={{ width: 9, height: 9, color: '#ea580c' }} />{minion.atk}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#851e1e', fontWeight: 800, fontFamily: 'Cinzel, serif' }}>
          {minion.currentHp}<Icon.shield style={{ width: 9, height: 9, color: '#851e1e' }} />
        </span>
      </div>
      {isTarget && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(220,38,38,0.15)', border: '2px solid #dc2626' }} />
      )}
    </div>
  )
}

// ── Carta in mano ─────────────────────────────────────────────────────────────
function HandCard({ card, affordable, onClick }: any) {
  const [hov, setHov] = useState(false)
  const isCreature = card.type === 'CREATURA'

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} title={card.abilityText}
      style={{
        width: 114, height: 162, borderRadius: 14, flexShrink: 0,
        backgroundColor: '#FAF7EE',
        backgroundImage: 'linear-gradient(180deg, #FAF7EE 0%, #F5F1E6 100%)',
        border: `1.5px solid ${affordable ? (hov ? '#f0a500' : '#6C8D88') : 'rgba(0,0,0,0.12)'}`,
        position: 'relative', overflow: 'hidden',
        cursor: affordable ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov && affordable ? 'translateY(-16px) scale(1.08)' : 'none',
        boxShadow: hov && affordable ? `0 0 20px rgba(240,165,0,0.4), 0 16px 32px rgba(0,0,0,0.4)` : `0 4px 12px rgba(0,0,0,0.25)`,
        filter: affordable ? 'none' : 'brightness(0.7) grayscale(0.4)',
        color: '#192523',
      }}>
      {/* Hanging Slate-Teal Ribbon */}
      <div style={{
        position: 'absolute', top: 0, left: 7, width: 20, height: 36,
        background: 'linear-gradient(180deg, #5E807B 0%, #6C8D88 100%)',
        borderRadius: '0 0 10px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 2, zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
      }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 11, color: '#fff', lineHeight: 1 }}>{card.cost}</span>
        <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid #fff', marginTop: 'auto', marginBottom: 3 }} />
      </div>

      {/* Card Artwork */}
      <div style={{ height: 86, margin: '4px', marginTop: 2, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <Icon.sword style={{ width: 32, height: 32, color: '#6C8D88' }} />}
      </div>

      {/* Title */}
      <div className="font-cinzel" style={{ padding: '0 6px', fontSize: 8.5, fontWeight: 800, color: '#192523', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
        {card.name}
      </div>

      {/* Ability */}
      <div style={{ padding: '1px 6px', fontSize: 7, color: '#384E4B', lineHeight: 1.2, height: 26, overflow: 'hidden', textAlign: 'center', fontStyle: 'italic', fontFamily: 'Merriweather, serif' }}>
        {card.abilityText}
      </div>

      {/* Bottom stats or Magic tag */}
      {isCreature ? (
        <div style={{ position: 'absolute', bottom: 3, left: 6, right: 6, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(108,141,136,0.2)', paddingTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9.5, color: '#192523', fontWeight: 800, fontFamily: 'Cinzel, serif' }}>
            <Icon.sword style={{ width: 8, height: 8, color: '#ea580c' }} />{card.atk}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9.5, color: '#851e1e', fontWeight: 800, fontFamily: 'Cinzel, serif' }}>
            {card.hp}<Icon.shield style={{ width: 8, height: 8, color: '#851e1e' }} />
          </span>
        </div>
      ) : (
        <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, textAlign: 'center', fontSize: 7.5, color: '#6C8D88', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em', fontWeight: 700 }}>
          ✦ MAGIA
        </div>
      )}
    </div>
  )
}

// ── Barra Eroe ────────────────────────────────────────────────────────────────
function HeroBar({ name, hp, shield, isOpponent, flash, mana, maxMana }: any) {
  const col = isOpponent ? '#f87171' : '#60a5fa'
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', flexShrink: 0, background: `rgba(${isOpponent ? '248,113,113' : '96,165,250'},${flash ? '0.18' : '0.04'})`, borderTop: isOpponent ? 'none' : '1px solid rgba(96,165,250,0.1)', borderBottom: isOpponent ? '1px solid rgba(248,113,113,0.1)' : 'none', transition: 'background 0.25s ease' }}>
      {!isOpponent && mana !== undefined && (
        <div style={{ display: 'flex', gap: 3, marginRight: 12, flexShrink: 0, alignItems: 'center' }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: i < mana ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : i < maxMana ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)', border: i < maxMana ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.05)', boxShadow: i < mana ? '0 0 6px rgba(59,130,246,0.55)' : 'none', transition: 'all 0.3s ease', flexShrink: 0 }} />
          ))}
          <span style={{ marginLeft: 5, fontSize: 9, color: '#60a5fa', fontFamily: 'Cinzel,serif', fontWeight: 700 }}>{mana}/{maxMana}</span>
        </div>
      )}
      <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, marginRight: 12, background: isOpponent ? 'linear-gradient(135deg,#3d0a0a,#6b1010)' : 'linear-gradient(135deg,#0a1f3d,#193766)', border: `2px solid ${flash ? col : col + '73'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${flash ? '26px' : '10px'} ${col}59`, transition: 'all 0.25s ease', order: isOpponent ? 0 : 3, marginLeft: isOpponent ? 0 : 12 }}>
        {isOpponent ? <Icon.bot style={{ width: 21, height: 21, color: col }} /> : <Icon.wizard style={{ width: 21, height: 21, color: col }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <div className="font-cinzel" style={{ fontSize: 11, color: col, letterSpacing: '0.06em' }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {shield > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#93c5fd', fontWeight: 700 }}><Icon.shield style={{ width: 10, height: 10 }} />{shield}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: isOpponent ? '#f87171' : '#4ade80', fontWeight: 700 }}><Icon.shield style={{ width: 11, height: 11 }} />{hp} / 30</span>
          </div>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(0, (hp / 30) * 100)}%`, background: isOpponent ? 'linear-gradient(90deg,#dc2626,#f87171)' : 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: 3, transition: 'width 0.5s ease', boxShadow: `0 0 8px ${col}66` }} />
        </div>
      </div>
    </div>
  )
}

export function RealArena() {
  const [screen, setScreen] = useState<'lobby' | 'battle'>('lobby')
  const [gameState, setGameState] = useState<any>(null)
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [pFlash, setPFlash] = useState(false)
  const [oFlash, setOFlash] = useState(false)
  const [cards, setCards] = useState<any[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const prevHp = useRef({ p: 30, o: 30 })

  // Carica SOLO le tue carte pubblicate dallo Studio, con sync live.
  useEffect(() => {
    let alive = true
    fetch(SERVER_URL + '/api/cards')
      .then(r => r.json())
      .then(d => { if (alive && Array.isArray(d)) setCards(d) })
      .catch(() => {})
    const s = io(SERVER_URL)
    s.on('cards_updated', ({ cards: c }: any) => { if (alive && Array.isArray(c)) setCards(c) })
    return () => { alive = false; s.disconnect() }
  }, [])

  const startSolo = () => {
    if (cards.length < 2) return
    const gs = createInitialGameState(cards, cards, 'Tu', 'AI Bot Arena')
    prevHp.current = { p: 30, o: 30 }
    setGameState(gs)
    setSelectedAttackerId(null)
    setScreen('battle')
  }

  // Turno AI
  useEffect(() => {
    if (!gameState || screen !== 'battle') return
    if (gameState.currentTurn === 'opponent' && !gameState.winner && !isAiThinking) {
      setIsAiThinking(true)
      executeAiTurn(gameState, (s: any) => setGameState(s), (t: string) => {
        if (t === 'attack') soundEngine.playAttack()
        else if (t === 'damage') soundEngine.playDamage()
        else if (t === 'card_play') soundEngine.playCardPlay()
        else if (t === 'turn_end') soundEngine.playButtonClick()
      }).then(() => setIsAiThinking(false))
    }
  }, [gameState?.currentTurn, gameState?.winner, screen])

  // Flash danno eroe + autoscroll log
  useEffect(() => {
    if (!gameState) return
    if (gameState.player.hp < prevHp.current.p) { setPFlash(true); setTimeout(() => setPFlash(false), 450) }
    if (gameState.opponent.hp < prevHp.current.o) { setOFlash(true); setTimeout(() => setOFlash(false), 450) }
    prevHp.current = { p: gameState.player.hp, o: gameState.opponent.hp }
    if (logRef.current) logRef.current.scrollTop = 0
  }, [gameState])

  if (screen === 'lobby' || !gameState) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 55% at 50% 0%, rgba(200,50,15,0.22) 0%, transparent 60%)' }} />
          <div className="glow-orb" style={{ position: 'absolute', left: '10%', top: '15%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(240,80,20,0.14) 0%, transparent 65%)', borderRadius: '50%' }} />
          <div className="glow-orb" style={{ position: 'absolute', right: '8%', top: '25%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(120,30,220,0.1) 0%, transparent 65%)', borderRadius: '50%', animationDelay: '1.5s' }} />
        </div>
        <div style={{ animation: 'slide-up 0.55s ease both', textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 2 }}>
          <div className="font-cinzel" style={{ fontSize: 10, letterSpacing: '0.5em', color: 'rgba(240,165,0,0.5)', textTransform: 'uppercase', marginBottom: 18 }}>Card Clash</div>
          <h2 className="font-cinzel-deco" style={{ fontSize: 'clamp(30px,5vw,60px)', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #f87171 0%, #f0a500 45%, #fde68a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.04em' }}>Arena di Battaglia</h2>
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(232,220,200,0.4)' }}>Motore reale · le tue carte · abilità attive</div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', animation: 'slide-up 0.55s ease 0.12s both', position: 'relative', zIndex: 2 }}>
          <button onClick={startSolo} disabled={cards.length < 2}
            style={{ width: 240, padding: '28px 24px', textAlign: 'left', background: 'linear-gradient(145deg, rgba(200,60,20,0.14) 0%, rgba(13,17,32,0.95) 100%)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 16, cursor: cards.length < 2 ? 'not-allowed' : 'pointer', opacity: cards.length < 2 ? 0.55 : 1, transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { if (cards.length < 2) return; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.65)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(248,113,113,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(200,40,40,0.28))', border: '1px solid rgba(248,113,113,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.bot style={{ width: 24, height: 24, color: '#f87171' }} />
            </div>
            <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 8, letterSpacing: '0.05em' }}>Sfida l'IA</div>
            <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.5)', lineHeight: 1.55, marginBottom: 18 }}>
              {cards.length === 0
                ? 'Nessuna tua carta trovata. Creale nel Card Creator Studio e pubblicale.'
                : `Giochi con le tue ${cards.length} carte create. Abilità, GUARDIANO e spine attivi.`}
            </div>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', fontSize: 9, color: '#f87171', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em' }}>
              {cards.length === 0 ? 'STUDIO RICHIESTO' : cards.length < 2 ? 'SERVONO ≥2 CARTE' : `${cards.length} TUE CARTE`}
            </div>
          </button>
          <button style={{ width: 240, padding: '28px 24px', textAlign: 'left', background: 'linear-gradient(145deg, rgba(96,165,250,0.06) 0%, rgba(13,17,32,0.95) 100%)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 16, cursor: 'not-allowed', opacity: 0.55 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.trophy style={{ width: 24, height: 24, color: '#60a5fa' }} />
            </div>
            <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginBottom: 8, letterSpacing: '0.05em' }}>Sfida LAN (Antonio)</div>
            <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.4)', lineHeight: 1.55, marginBottom: 18 }}>Partita in rete locale contro un collega. In arrivo nel prossimo step.</div>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.18)', fontSize: 9, color: 'rgba(96,165,250,0.5)', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em' }}>PROSSIMAMENTE</div>
          </button>
        </div>
      </div>
    )
  }

  const p = gameState.player
  const o = gameState.opponent
  const isMyTurn = gameState.currentTurn === 'player'
  const winner = gameState.winner
  const enemyHasTaunt = o.board.some((m: any) => m.hasTaunt)

  const onHandClick = (card: any) => {
    if (!isMyTurn || winner || p.mana < card.cost) { if (isMyTurn && !winner) soundEngine.playDamage(); return }
    soundEngine.playCardPlay()
    setGameState(playCard(gameState, true, card.instanceId))
    setSelectedAttackerId(null)
  }
  const onFriendlyClick = (m: any) => {
    if (!isMyTurn || winner || !m.canAttack) return
    soundEngine.playButtonClick()
    setSelectedAttackerId(prev => prev === m.instanceId ? null : m.instanceId)
  }
  const onAttack = (targetType: 'hero' | 'minion', targetId: string | null) => {
    if (!isMyTurn || !selectedAttackerId || winner) return
    soundEngine.playAttack()
    setGameState(attackTarget(gameState, true, selectedAttackerId, targetType, targetId))
    setSelectedAttackerId(null)
  }
  const onEndTurn = () => {
    if (!isMyTurn || winner || isAiThinking) return
    soundEngine.playButtonClick()
    setSelectedAttackerId(null)
    setGameState(endTurn(gameState))
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 130% 45% at 50% 0%, rgba(200,50,15,0.2) 0%, transparent 55%), radial-gradient(ellipse 130% 45% at 50% 100%, rgba(20,60,200,0.13) 0%, transparent 55%), linear-gradient(180deg, rgba(50,10,5,0.4) 0%, rgba(6,8,15,0.96) 25%, rgba(6,8,15,0.96) 75%, rgba(5,12,50,0.4) 100%)` }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(240,165,0,0.4) 50%, transparent)', transform: 'translateY(-50%)' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0, background: 'rgba(6,8,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(240,165,0,0.07)' }}>
          <button onClick={() => { setScreen('lobby'); setGameState(null) }} style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', cursor: 'pointer', fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: '0.06em' }}>← Abbandona</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="font-cinzel" style={{ fontSize: 10, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em' }}>TURNO {gameState.turnNumber}</div>
            <div style={{ padding: '5px 18px', borderRadius: 20, background: isMyTurn ? 'linear-gradient(135deg,rgba(96,165,250,0.2),rgba(59,130,246,0.1))' : 'linear-gradient(135deg,rgba(248,113,113,0.2),rgba(200,60,20,0.1))', border: `1px solid ${isMyTurn ? 'rgba(96,165,250,0.4)' : 'rgba(248,113,113,0.4)'}`, fontSize: 10, fontFamily: 'Cinzel,serif', fontWeight: 700, color: isMyTurn ? '#60a5fa' : '#f87171', letterSpacing: '0.08em' }}>
              {isMyTurn ? '⚔ IL TUO TURNO' : isAiThinking ? '⏳ AI PENSA…' : '⏳ AVVERSARIO'}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.25)' }}>Mazzo: {p.deck.length}</div>
        </div>

        <HeroBar name={o.name} hp={o.hp} shield={o.shield} isOpponent flash={oFlash} />

        {/* Campo avversario */}
        <div onClick={() => { if (selectedAttackerId && !enemyHasTaunt) onAttack('hero', null) }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(240,165,0,0.05)', minHeight: 0, cursor: selectedAttackerId && !enemyHasTaunt ? 'crosshair' : 'default' }}>
          {o.board.length === 0 ? (
            <div style={{ color: 'rgba(232,220,200,0.12)', fontSize: 11, border: `1px dashed ${selectedAttackerId && !enemyHasTaunt ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '14px 40px', background: selectedAttackerId && !enemyHasTaunt ? 'rgba(248,113,113,0.05)' : 'transparent' }}>
              {selectedAttackerId ? "Clicca qui per colpire l'Eroe!" : 'Nessuna creatura nemica'}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {o.board.map((m: any) => (
                <BoardMinion key={m.instanceId} minion={m} side="opponent"
                  isTarget={!!selectedAttackerId && (!enemyHasTaunt || m.hasTaunt)}
                  onClick={(e: any) => { e.stopPropagation?.(); if (selectedAttackerId) onAttack('minion', m.instanceId) }} />
              ))}
            </div>
          )}
        </div>

        {/* Divider + fine turno */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '7px 16px', flexShrink: 0, gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(240,165,0,0.2), transparent)' }} />
          <button onClick={onEndTurn} disabled={!isMyTurn || isAiThinking || !!winner} className="font-cinzel"
            style={{ padding: '8px 24px', borderRadius: 20, flexShrink: 0, background: isMyTurn && !isAiThinking && !winner ? 'linear-gradient(135deg,#f0a500,#d4842a)' : 'rgba(13,17,32,0.8)', border: isMyTurn && !isAiThinking && !winner ? 'none' : '1px solid rgba(240,165,0,0.12)', color: isMyTurn && !isAiThinking && !winner ? '#06080f' : 'rgba(232,220,200,0.2)', cursor: isMyTurn && !isAiThinking && !winner ? 'pointer' : 'not-allowed', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: isMyTurn && !isAiThinking && !winner ? '0 4px 20px rgba(240,165,0,0.35)' : 'none' }}>Fine Turno →</button>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(240,165,0,0.2), transparent)' }} />
        </div>

        {/* Campo giocatore */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderTop: '1px solid rgba(96,165,250,0.05)', minHeight: 0 }}>
          {p.board.length === 0 ? (
            <div style={{ color: 'rgba(232,220,200,0.12)', fontSize: 11, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 40px' }}>Gioca una carta per evocarla</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {p.board.map((m: any) => (
                <BoardMinion key={m.instanceId} minion={m} side="player" selectable={isMyTurn && m.canAttack} isSelected={selectedAttackerId === m.instanceId} onClick={() => onFriendlyClick(m)} />
              ))}
            </div>
          )}
        </div>

        <HeroBar name={`${p.name} (Tu)`} hp={p.hp} shield={p.shield} isOpponent={false} flash={pFlash} mana={p.mana} maxMana={p.maxMana} />

        {/* Mano */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '10px 16px 8px', flexShrink: 0, gap: 8, flexWrap: 'wrap', background: 'rgba(6,8,15,0.7)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(240,165,0,0.06)', minHeight: 120 }}>
          {p.hand.length === 0 && <div style={{ alignSelf: 'center', fontSize: 11, color: 'rgba(232,220,200,0.15)' }}>Mano vuota</div>}
          {p.hand.map((card: any) => (
            <HandCard key={card.instanceId} card={card} affordable={isMyTurn && !winner && p.mana >= card.cost} onClick={() => onHandClick(card)} />
          ))}
        </div>
      </div>

      {/* Log laterale */}
      <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(6,8,15,0.94)', borderLeft: '1px solid rgba(240,165,0,0.07)', zIndex: 2 }}>
        <div className="font-cinzel" style={{ padding: '11px 14px', borderBottom: '1px solid rgba(240,165,0,0.07)', fontSize: 9, letterSpacing: '0.14em', color: 'rgba(232,220,200,0.35)' }}>REGISTRO BATTAGLIA</div>
        <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {gameState.combatLogs.map((log: any, i: number) => (
            <div key={log.id} style={{ fontSize: 10, lineHeight: 1.5, padding: '5px 8px', borderRadius: 6, color: i === 0 ? '#e8dcc8' : 'rgba(232,220,200,0.5)', background: log.type === 'attack' || log.type === 'damage' ? 'rgba(248,113,113,0.08)' : log.type === 'summon' ? 'rgba(240,165,0,0.07)' : log.type === 'spell' ? 'rgba(96,165,250,0.07)' : log.type === 'death' ? 'rgba(255,255,255,0.03)' : 'transparent', borderLeft: i === 0 ? '2px solid rgba(240,165,0,0.5)' : '2px solid transparent' }}>{log.text}</div>
          ))}
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(240,165,0,0.07)', fontSize: 9, color: 'rgba(232,220,200,0.25)', lineHeight: 1.7 }}>
          <div style={{ color: 'rgba(240,165,0,0.6)', fontFamily: 'Cinzel,serif', fontSize: 8, marginBottom: 5, letterSpacing: '0.08em' }}>COME GIOCARE</div>
          · Clicca una carta per giocarla<br/>
          · Clicca una tua creatura → nemico<br/>
          · Punto oro = può attaccare
        </div>
      </div>

      {/* Game over */}
      {winner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease both' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-cinzel-deco" style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, color: winner === 'player' ? '#ffd700' : winner === 'draw' ? '#e8dcc8' : '#f87171', textShadow: winner === 'player' ? '0 0 60px rgba(255,215,0,0.55)' : '0 0 60px rgba(248,113,113,0.45)', marginBottom: 12 }}>
              {winner === 'player' ? 'Vittoria!' : winner === 'draw' ? 'Pareggio' : 'Sconfitta'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(232,220,200,0.5)', marginBottom: 36 }}>
              {winner === 'player' ? "Hai annientato l'Eroe avversario!" : winner === 'draw' ? 'Entrambi gli Eroi sono caduti.' : 'I tuoi HP sono a zero. Riprova!'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={startSolo} className="btn-primary font-cinzel" style={{ padding: '13px 36px', borderRadius: 12, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 28px rgba(240,165,0,0.4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.sword style={{ width: 13, height: 13 }} /> Rivincita</span>
              </button>
              <button onClick={() => { setScreen('lobby'); setGameState(null) }} className="font-cinzel" style={{ padding: '13px 28px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(240,165,0,0.3)', color: 'rgba(232,220,200,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

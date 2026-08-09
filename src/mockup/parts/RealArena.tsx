import { useState, useEffect, useRef, useMemo } from 'react'
import { io } from 'socket.io-client'
import { Icon } from '../NewUI'
import { createInitialGameState, playCard, attackTarget, endTurn, getCardEffectiveCost } from '../../engine/gameEngine'
import { executeAiTurn } from '../../engine/aiBot'
import { soundEngine } from '../../engine/soundEngine'
import { usePlayerEconomy, usePlayerInventory, applyCardLevelStats } from '../playerState'
import { buildAiDeck } from '../aiDecks'

// Le carte del gioco sono SOLO quelle create da te nel Card Creator Studio,
// pubblicate sul server. Niente carte di default.
const SERVER_URL = 'http://localhost:4000'

// Mazzo salvato dal Deck Builder
const DECK_KEY = 'card_clash_newui_deck_v1'

// Costruisce il mazzo del giocatore dal salvataggio del Deck Builder, limitato
// alle copie effettivamente possedute e con statistiche di livello applicate.
function buildPlayerDeck(allCards: any[], inventory: Record<string, number>, cardLevels: Record<string, number> = {}): { deck: any[]; source: 'deck' | 'owned' | 'all' } {
  const byId: Record<string, any> = Object.fromEntries(allCards.map(c => [c.id, applyCardLevelStats(c, cardLevels[c.id] || 1)]))
  let counts: Record<string, number> = {}
  try {
    const raw = localStorage.getItem(DECK_KEY)
    if (raw) { const d = JSON.parse(raw); if (d?.counts && typeof d.counts === 'object') counts = d.counts }
  } catch {}
  const deck: any[] = []
  for (const [id, n] of Object.entries(counts)) {
    const card = byId[id]
    if (!card) continue
    const owned = inventory[id] || 0
    const qty = Math.min(Number(n) || 0, owned)
    for (let i = 0; i < qty; i++) deck.push(card)
  }
  if (deck.length >= 2) return { deck, source: 'deck' }
  const owned = allCards.filter(c => (inventory[c.id] || 0) > 0).map(c => applyCardLevelStats(c, cardLevels[c.id] || 1))
  if (owned.length >= 2) return { deck: owned, source: 'owned' }
  return { deck: allCards.map(c => applyCardLevelStats(c, cardLevels[c.id] || 1)), source: 'all' }
}

// Mappa rarità delle carte REALI (common/rare/epic/legendary/mythic) al look nuovo
const REAL_RARITY: Record<string, { color: string; label: string }> = {
  common:    { color: '#9ca3af', label: '· COMUNE' },
  rare:      { color: '#60a5fa', label: '● RARA' },
  epic:      { color: '#c084fc', label: '◆ EPICA' },
  legendary: { color: '#ffd700', label: '★ LEGGENDARIA' },
  mythic:    { color: '#f87171', label: '✦ MITICA' },
}
const rarInfo = (r: string) => REAL_RARITY[r] || REAL_RARITY.common

// ── Tile creatura sul campo con animazioni di combattimento ───────────────────
function BoardMinion({ minion, side, selectable, isSelected, isTarget, isAttacking, attackDir, hasSlash, hasSparks, hasShieldBreak, hasSpell, hasHeal, isDying, floatingText, onInspect, onClick }: any) {
  const [hov, setHov] = useState(false)
  const lowHp = minion.currentHp < minion.hp * 0.4
  const animClass = isDying ? 'minion-dying-dissolve' : isAttacking ? (attackDir === 'up' ? 'anim-attack-up' : 'anim-attack-down') : ''

  return (
    <div onClick={onClick} onMouseEnter={() => { setHov(true); onInspect && onInspect(minion) }} onMouseLeave={() => { setHov(false); onInspect && onInspect(null) }} title={minion.abilityText}
      className={animClass}
      style={{
        width: 104, height: 142, borderRadius: 12,
        backgroundColor: '#FAF7EE',
        backgroundImage: 'linear-gradient(180deg, #FAF7EE 0%, #F5F1E6 100%)',
        border: `2px solid ${isSelected ? '#f0a500' : isTarget && hov ? '#dc2626' : hov ? '#6C8D88' : '#D1C9B8'}`,
        position: 'relative', overflow: 'visible',
        cursor: (selectable || isTarget) && !isDying ? 'pointer' : 'default',
        transition: (isAttacking || isDying) ? 'none' : 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        transform: isDying ? undefined : isSelected ? 'scale(1.1) translateY(-6px)' : hov && (selectable || isTarget) ? 'scale(1.05) translateY(-3px)' : 'scale(1)',
        boxShadow: isSelected ? '0 0 24px rgba(240,165,0,0.7), 0 16px 34px rgba(0,0,0,0.5)' : isTarget && hov ? '0 0 20px rgba(220,38,38,0.6)' : `0 4px 14px rgba(0,0,0,0.25)`,
        filter: !minion.canAttack && side === 'player' && !isTarget ? 'brightness(0.85)' : 'none',
        flexShrink: 0,
        color: '#192523',
      }}>
      
      {/* Floating Combat Text */}
      {floatingText && (
        <div className="floating-combat-number" style={{ top: 10, left: '50%', color: floatingText.color || '#f87171', fontSize: 16 }}>
          {floatingText.text}
        </div>
      )}

      {/* Visual Slash Arc FX */}
      {hasSlash && <div className="slash-effect-line" />}

      {/* Impact Sparks Blast FX */}
      {hasSparks && <div className="impact-sparks-fx" />}

      {/* Shield Barrier Deflect FX */}
      {hasShieldBreak && <div className="shield-deflect-fx" />}

      {/* Spell Shockwave FX */}
      {hasSpell && <div className="spell-shockwave-ring" />}

      {/* Heal Aura FX */}
      {hasHeal && <div className="magic-aura-heal-fx" />}

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
      {side === 'player' && minion.canAttack && !isDying && (
        <div style={{ position: 'absolute', top: 4, right: minion.hasTaunt ? 26 : 4, zIndex: 5, width: 8, height: 8, borderRadius: '50%', background: '#f0a500', boxShadow: '0 0 8px rgba(240,165,0,0.9)', animation: 'badge-pulse 1.5s ease infinite' }} />
      )}

      {/* Creature Artwork */}
      <div style={{ height: 80, margin: '4px', marginTop: 2, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {minion.imageUrl
          ? <img src={minion.imageUrl} alt={minion.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <Icon.sword style={{ width: 32, height: 32, color: '#6C8D88' }} />}
      </div>

      <div 
        className="font-cinzel" 
        title={minion.name}
        style={{ 
          padding: '0 4px', 
          fontSize: (minion.name?.length || 0) > 18 ? 6.5 : (minion.name?.length || 0) > 13 ? 7.2 : 8, 
          fontWeight: 800, 
          color: '#192523', 
          textTransform: 'uppercase', 
          letterSpacing: '-0.01em', 
          lineHeight: 1.05, 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          textAlign: 'center',
          height: 18,
        }}
      >
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
      {isTarget && !isDying && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(220,38,38,0.15)', border: '2px solid #dc2626' }} />
      )}
    </div>
  )
}

// ── Carta in mano ─────────────────────────────────────────────────────────────
function HandCard({ card, effectiveCost, isDiscounted, affordable, index = 0, total = 1, onInspect, onClick }: any) {
  const [hov, setHov] = useState(false)
  const isCreature = card.type === 'CREATURA'
  const displayCost = effectiveCost !== undefined ? effectiveCost : card.cost

  // Disposizione a ventaglio: rotazione e leggero abbassamento agli estremi.
  const mid = (total - 1) / 2
  const fanAngle = total > 1 ? (index - mid) * 4 : 0
  const fanLift = Math.abs(index - mid) * 5

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { setHov(true); onInspect && onInspect(card) }}
      onMouseLeave={() => { setHov(false); onInspect && onInspect(null) }}
      style={{
        width: 114, height: 162, borderRadius: 14, flexShrink: 0,
        marginLeft: index === 0 ? 0 : -20,
        transformOrigin: 'bottom center',
        backgroundColor: '#FAF7EE',
        backgroundImage: 'linear-gradient(180deg, #FAF7EE 0%, #F5F1E6 100%)',
        border: `1.5px solid ${affordable ? (hov ? '#f0a500' : isDiscounted ? '#f59e0b' : '#6C8D88') : 'rgba(0,0,0,0.12)'}`,
        position: 'relative', overflow: 'hidden',
        cursor: affordable ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov
          ? 'translateY(-38px) rotate(0deg) scale(1.28)'
          : `translateY(${fanLift}px) rotate(${fanAngle}deg)`,
        zIndex: hov ? 60 : index,
        boxShadow: hov ? `0 0 24px rgba(240,165,0,0.45), 0 22px 40px rgba(0,0,0,0.55)` : `0 4px 12px rgba(0,0,0,0.25)`,
        filter: affordable ? 'none' : 'brightness(0.72) grayscale(0.35)',
        color: '#192523',
      }}>
      {/* Hanging Ribbon (Gold/Amber if discounted) */}
      <div style={{
        position: 'absolute', top: 0, left: 7, width: 20, height: 36,
        background: isDiscounted ? 'linear-gradient(180deg, #b45309 0%, #f59e0b 100%)' : 'linear-gradient(180deg, #5E807B 0%, #6C8D88 100%)',
        borderRadius: '0 0 10px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 2, zIndex: 5, boxShadow: isDiscounted ? '0 0 10px rgba(245,158,11,0.7)' : '0 2px 4px rgba(0,0,0,0.25)'
      }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 11, color: '#fff', lineHeight: 1 }}>{displayCost}</span>
        <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid #fff', marginTop: 'auto', marginBottom: 3 }} />
      </div>

      {/* Card Artwork */}
      <div style={{ height: 86, margin: '4px', marginTop: 2, borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <Icon.sword style={{ width: 32, height: 32, color: '#6C8D88' }} />}
      </div>

      {/* Title */}
      <div 
        className="font-cinzel" 
        title={card.name}
        style={{ 
          padding: '0 4px', 
          fontSize: (card.name?.length || 0) > 20 ? 7 : (card.name?.length || 0) > 13 ? 7.6 : 8.5, 
          fontWeight: 800, 
          color: '#192523', 
          textTransform: 'uppercase', 
          letterSpacing: '-0.01em', 
          lineHeight: 1.06, 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          textAlign: 'center', 
          minHeight: 18,
          maxHeight: 22
        }}
      >
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

// ── Barra Eroe con effetti di danno e suoni ──────────────────────────────────
function HeroBar({ name, hp, shield, isOpponent, flash, hasSlash, hasSparks, hasShieldBreak, hasSpell, hasHeal, floatingText, mana, maxMana }: any) {
  const col = isOpponent ? '#f87171' : '#60a5fa'
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', flexShrink: 0, background: `rgba(${isOpponent ? '248,113,113' : '96,165,250'},${flash ? '0.24' : '0.04'})`, borderTop: isOpponent ? 'none' : '1px solid rgba(96,165,250,0.1)', borderBottom: isOpponent ? '1px solid rgba(248,113,113,0.1)' : 'none', transition: 'background 0.25s ease', position: 'relative' }}>
      
      {/* Floating Combat Text on Hero */}
      {floatingText && (
        <div className="floating-combat-number" style={{ top: isOpponent ? 24 : -10, left: isOpponent ? '60%' : '40%', color: floatingText.color || '#f87171', fontSize: 20 }}>
          {floatingText.text}
        </div>
      )}

      {/* Visual Slash Arc FX */}
      {hasSlash && <div className="slash-effect-line" />}

      {/* Impact Sparks FX */}
      {hasSparks && <div className="impact-sparks-fx" />}

      {/* Shield Barrier Deflect FX */}
      {hasShieldBreak && <div className="shield-deflect-fx" />}

      {/* Spell Shockwave FX */}
      {hasSpell && <div className="spell-shockwave-ring" />}

      {/* Heal Aura FX */}
      {hasHeal && <div className="magic-aura-heal-fx" />}

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

// Pila visiva mazzo/cimitero con conteggio
function CardPile({ count, label, kind, pos }: { count: number; label: string; kind: 'deck' | 'grave'; pos: any }) {
  const color = kind === 'deck' ? '#60a5fa' : '#9ca3af'
  const empty = count <= 0
  return (
    <div style={{ position: 'absolute', zIndex: 6, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: empty ? 0.35 : 1, ...pos }}>
      <div style={{ position: 'relative', width: 46, height: 64 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: 'absolute', left: i * 2, top: -i * 2, width: 46, height: 64, borderRadius: 6, background: kind === 'deck' ? 'linear-gradient(160deg,#1e3a8a,#0b1220)' : 'linear-gradient(160deg,#2b2f3a,#0b0e14)', border: `1px solid ${color}66`, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {kind === 'deck' ? <Icon.layers style={{ width: 20, height: 20, color }} /> : <Icon.skull style={{ width: 20, height: 20, color }} />}
        </div>
        <div className="font-cinzel" style={{ position: 'absolute', bottom: -7, right: -7, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: '#06080f', border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</div>
      </div>
      <div className="font-cinzel" style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(232,220,200,0.5)' }}>{label}</div>
    </div>
  )
}

export function RealArena() {
  const [screen, setScreen] = useState<'lobby' | 'battle'>('lobby')
  const [lobbyMode, setLobbyMode] = useState<'menu' | 'host' | 'join'>('menu')
  const [gameState, setGameState] = useState<any>(null)
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [pFlash, setPFlash] = useState(false)
  const [oFlash, setOFlash] = useState(false)
  const [cards, setCards] = useState<any[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const prevHp = useRef({ p: 30, o: 30 })

  // ── Audio & Visual FX State ────────────────────────────────────────────────
  const [isMusicOn, setIsMusicOn] = useState(true)
  const [isSfxOn, setIsSfxOn] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)          // menu di gioco (ESC)
  const [musicVol, setMusicVol] = useState<number>(() => { try { return soundEngine.getMusicVolume?.() ?? 0.28 } catch { return 0.28 } })
  const [animAttackerId, setAnimAttackerId] = useState<string | null>(null)
  const [animAttackerDir, setAnimAttackerDir] = useState<'up' | 'down'>('up')
  const [slashTargets, setSlashTargets] = useState<{ [key: string]: boolean }>({})
  const [sparksTargets, setSparksTargets] = useState<{ [key: string]: boolean }>({})
  const [shieldBreakTargets, setShieldBreakTargets] = useState<{ [key: string]: boolean }>({})
  const [spellTargets, setSpellTargets] = useState<{ [key: string]: boolean }>({})
  const [healTargets, setHealTargets] = useState<{ [key: string]: boolean }>({})
  const [dyingMinions, setDyingMinions] = useState<{ [key: string]: any }>({})
  const [floatingTexts, setFloatingTexts] = useState<{ [key: string]: { text: string; color: string } }>({})
  const [screenShake, setScreenShake] = useState<'subtle' | 'heavy' | null>(null)
  const [turnBanner, setTurnBanner] = useState<{ text: string; isPlayer: boolean } | null>(null)
  const prevTurn = useRef<string | null>(null)
  const prevBoardMinionsRef = useRef<Map<string, any>>(new Map())

  // ── Pannello di lettura/anteprima carta (a sinistra) ───────────────────────
  const [inspectCard, setInspectCard] = useState<any>(null)          // carta sotto il mouse
  const [summonPreview, setSummonPreview] = useState<any>(null)      // carta appena evocata (2.5s)
  const prevBoardIds = useRef<Set<string>>(new Set())
  const summonTimer = useRef<any>(null)

  // ── Stato multiplayer LAN ──────────────────────────────────────────────────
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [isHost, setIsHost] = useState(true)
  const [playerName, setPlayerName] = useState('Tu')
  const [roomId, setRoomId] = useState(() => Math.floor(1000 + Math.random() * 9000).toString())
  const [hostIp, setHostIp] = useState('localhost:4000')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [matchRoom, setMatchRoom] = useState('')
  const [lanInfo, setLanInfo] = useState<any>(null)
  const [connecting, setConnecting] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [oppLeft, setOppLeft] = useState(false)
  const [copied, setCopied] = useState(false)
  const gameSocket = useRef<any>(null)
  const rewardGivenRef = useRef<boolean>(false)
  const { addGold } = usePlayerEconomy()
  const { inventory, cardLevels } = usePlayerInventory()

  // Mazzo del giocatore: dal Deck Builder (clampato al posseduto), con fallback e statistiche di livello.
  // Ricalcolato al montaggio dell'arena e quando cambiano carte/inventario/livelli.
  const myDeck = useMemo(() => buildPlayerDeck(cards, inventory, cardLevels), [cards, inventory, cardLevels])

  // In solo (e come host) io sono il lato "player"; come guest sono "opponent".
  const meIsHost = !isMultiplayer || isHost

  // Helper per mostrare numeri di danno fluttuanti
  const triggerFloatingNumber = (targetKey: string, text: string, color = '#f87171') => {
    setFloatingTexts(prev => ({ ...prev, [targetKey]: { text, color } }))
    setTimeout(() => {
      setFloatingTexts(prev => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
    }, 1100)
  }

  // Helper per attivare squarcio di spada
  const triggerSlashFx = (targetKey: string) => {
    setSlashTargets(prev => ({ ...prev, [targetKey]: true }))
    setTimeout(() => {
      setSlashTargets(prev => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
    }, 450)
  }

  // Helper per attivare scintille di impatto
  const triggerSparksFx = (targetKey: string) => {
    setSparksTargets(prev => ({ ...prev, [targetKey]: true }))
    setTimeout(() => {
      setSparksTargets(prev => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
    }, 480)
  }

  // Helper per attivare scudo deflesso
  const triggerShieldBreakFx = (targetKey: string) => {
    setShieldBreakTargets(prev => ({ ...prev, [targetKey]: true }))
    soundEngine.playHeroShieldBreak()
    setTimeout(() => {
      setShieldBreakTargets(prev => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
    }, 520)
  }

  // Helper per attivare onda magica
  const triggerSpellFx = (targetKey: string) => {
    setSpellTargets(prev => ({ ...prev, [targetKey]: true }))
    setTimeout(() => {
      setSpellTargets(prev => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
    }, 600)
  }

  // Helper per attivare aura di cura
  const triggerHealFx = (targetKey: string) => {
    setHealTargets(prev => ({ ...prev, [targetKey]: true }))
    soundEngine.playMagicCast()
    setTimeout(() => {
      setHealTargets(prev => {
        const next = { ...prev }
        delete next[targetKey]
        return next
      })
    }, 800)
  }

  // Esegue l'animazione completa di combattimento con fisica di scatto, impatto e squarcio
  const triggerCombatAnim = (attackerId: string, dir: 'up' | 'down', targetKey: string, damage: number) => {
    setAnimAttackerId(attackerId)
    setAnimAttackerDir(dir)
    triggerSlashFx(targetKey)
    triggerSparksFx(targetKey)
    triggerFloatingNumber(targetKey, `-${damage}`, damage >= 5 ? '#f59e0b' : '#f87171')
    setScreenShake(damage >= 4 ? 'heavy' : 'subtle')
    soundEngine.playSwordSlash()

    setTimeout(() => setAnimAttackerId(null), 480)
    setTimeout(() => setScreenShake(null), 380)
  }

  // Carica SOLO le tue carte pubblicate dallo Studio, con sync live + info LAN.
  useEffect(() => {
    let alive = true
    fetch(SERVER_URL + '/api/cards')
      .then(r => r.json())
      .then(d => { if (alive && Array.isArray(d)) setCards(d) })
      .catch(() => {})
    fetch(SERVER_URL + '/api/info')
      .then(r => r.json())
      .then(d => { if (alive && d) { setLanInfo(d); if (d.ip) setHostIp(`${d.ip}:${d.port || 4000}`) } })
      .catch(() => {})
    const s = io(SERVER_URL)
    s.on('cards_updated', ({ cards: c }: any) => { if (alive && Array.isArray(c)) setCards(c) })
    return () => { alive = false; s.disconnect() }
  }, [])

  // Avvia/ferma la musica quando si entra/esce dal campo di battaglia
  useEffect(() => {
    if (screen === 'battle') {
      soundEngine.startBattleMusic()
    } else {
      soundEngine.stopBattleMusic()
    }
    return () => { soundEngine.stopBattleMusic() }
  }, [screen])

  // Rileva le evocazioni (nuove creature in campo, da entrambi i lati) e mostra
  // l'anteprima della carta a sinistra per ~2.5 secondi.
  useEffect(() => {
    if (screen !== 'battle' || !gameState) { prevBoardIds.current = new Set(); return }
    const board = [...(gameState.player?.board || []), ...(gameState.opponent?.board || [])]
    const ids = new Set<string>(board.map((m: any) => m.instanceId))
    let summoned: any = null
    for (const m of board) {
      if (!prevBoardIds.current.has(m.instanceId)) summoned = m
    }
    prevBoardIds.current = ids
    if (summoned) {
      setSummonPreview(summoned)
      if (summonTimer.current) clearTimeout(summonTimer.current)
      summonTimer.current = setTimeout(() => setSummonPreview(null), 2500)
    }
  }, [gameState, screen])

  // Monitora lo stato di tensione (Low HP) e la fine della partita (Vittoria/Sconfitta)
  useEffect(() => {
    if (!gameState || screen !== 'battle') return
    const mine = meIsHost ? gameState.player : gameState.opponent
    const foes = meIsHost ? gameState.opponent : gameState.player
    
    // Tension mode se un eroe ha <= 10 HP
    soundEngine.setTensionMode(mine.hp <= 10 || foes.hp <= 10)

    // Jingle di fine partita e accredito ricompense in monete
    if (gameState.winner) {
      soundEngine.stopBattleMusic()
      const iWon = (meIsHost && gameState.winner === 'player') || (!meIsHost && gameState.winner === 'opponent')
      if (iWon) {
        soundEngine.playVictoryJingle()
      } else if (gameState.winner !== 'draw') {
        soundEngine.playDefeatJingle()
      }

      if (!rewardGivenRef.current) {
        rewardGivenRef.current = true
        const reward = iWon ? 150 : 30
        addGold(reward)
      }
    }
  }, [gameState?.player?.hp, gameState?.opponent?.hp, gameState?.winner, screen, meIsHost])

  // Banner animato di cambio turno
  useEffect(() => {
    if (!gameState || screen !== 'battle' || gameState.winner) return
    const turnKey = `${gameState.turnNumber}_${gameState.currentTurn}`
    if (prevTurn.current !== turnKey) {
      prevTurn.current = turnKey
      const isPlayerTurn = meIsHost ? gameState.currentTurn === 'player' : gameState.currentTurn === 'opponent'
      setTurnBanner({
        text: isPlayerTurn ? '⚔ IL TUO TURNO' : '⏳ TURNO AVVERSARIO',
        isPlayer: isPlayerTurn
      })
      soundEngine.playTurnStartChime()
      setTimeout(() => setTurnBanner(null), 1400)
    }
  }, [gameState?.turnNumber, gameState?.currentTurn, screen, meIsHost, gameState?.winner])

  // Chiude il socket di gioco e riporta alla lobby, resettando lo stato multiplayer.
  const leaveMatch = () => {
    if (gameSocket.current) { gameSocket.current.disconnect(); gameSocket.current = null }
    soundEngine.stopBattleMusic()
    setGameState(null); setScreen('lobby'); setLobbyMode('menu')
    setIsMultiplayer(false); setIsHost(true)
    setConnecting(false); setConnError(null); setOppLeft(false)
    setSelectedAttackerId(null)
    setAnimAttackerId(null)
    setTurnBanner(null)
    setMenuOpen(false)
  }

  // Menu di gioco: ESC apre/chiude il menu impostazioni durante la battaglia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screen === 'battle') { e.preventDefault(); setMenuOpen(m => !m) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen])

  const startSolo = () => {
    if (myDeck.deck.length < 2) return
    setIsMultiplayer(false); setIsHost(true)
    rewardGivenRef.current = false
    // Giocatore col proprio mazzo; l'AI usa un mazzo predefinito dell'espansione.
    const aiDeck = buildAiDeck(cards)
    const gs = createInitialGameState(myDeck.deck, aiDeck.length >= 2 ? aiDeck : cards, 'Tu', 'AI Bot Arena')
    prevHp.current = { p: 30, o: 30 }
    setGameState(gs)
    setSelectedAttackerId(null)
    setScreen('battle')
  }

  // Host: crea la stanza, attende l'avversario, poi genera e sincronizza lo stato.
  const startHost = () => {
    if (myDeck.deck.length < 2) return
    setIsMultiplayer(true); setIsHost(true); setConnecting(true); setConnError(null); setOppLeft(false)
    setMatchRoom(roomId)
    const s = io('http://' + hostIp.replace(/^https?:\/\//, ''))
    gameSocket.current = s
    s.emit('host_room', { roomId, playerName, deck: myDeck.deck })
    s.on('player_joined', ({ guest }: any) => {
      const guestDeck = guest?.deck?.length >= 2 ? guest.deck : cards
      const gs = createInitialGameState(myDeck.deck, guestDeck, playerName, guest?.name || 'Sfidante')
      prevHp.current = { p: 30, o: 30 }
      s.emit('sync_game_state', { roomId, gameState: gs })
      setGameState(gs); setSelectedAttackerId(null); setConnecting(false); setScreen('battle')
    })
    s.on('opponent_disconnected', () => setOppLeft(true))
  }

  // Guest: si unisce alla stanza e attende lo stato iniziale dall'host.
  const startJoin = () => {
    if (!joinRoomId || myDeck.deck.length < 2) return
    setIsMultiplayer(true); setIsHost(false); setConnecting(true); setConnError(null); setOppLeft(false)
    setMatchRoom(joinRoomId)
    const url = 'http://' + hostIp.replace(/^https?:\/\//, '')
    const s = io(url)
    gameSocket.current = s
    s.emit('join_room', { roomId: joinRoomId, playerName, deck: myDeck.deck })
    s.on('join_error', ({ message }: any) => { setConnecting(false); setConnError(message || 'Connessione fallita.') })
    s.on('game_state_synced', ({ gameState: gs }: any) => {
      prevHp.current = { p: 30, o: 30 }
      setGameState(gs); setSelectedAttackerId(null); setConnecting(false); setScreen('battle')
    })
    s.on('opponent_disconnected', () => setOppLeft(true))
  }

  const copyHostInfo = () => {
    try { navigator.clipboard?.writeText(`Card Clash — IP: ${hostIp} · Codice Stanza: ${roomId}`) } catch {}
    setCopied(true); soundEngine.playButtonClick(); setTimeout(() => setCopied(false), 2000)
  }

  // Turno AI — solo in modalità solitaria (mai in LAN)
  useEffect(() => {
    if (!gameState || screen !== 'battle' || isMultiplayer) return
    if (gameState.currentTurn === 'opponent' && !gameState.winner && !isAiThinking) {
      setIsAiThinking(true)
      executeAiTurn(gameState, (s: any) => setGameState(s), (t: string, payload?: any) => {
        if (t === 'attack') {
          if (payload?.attackerId && payload?.targetKey) {
            triggerCombatAnim(payload.attackerId, 'down', payload.targetKey, payload.damage || 2)
          } else {
            soundEngine.playSwordSlash()
            setScreenShake('subtle')
            setTimeout(() => setScreenShake(null), 300)
          }
        } else if (t === 'damage') {
          soundEngine.playDamage()
          setScreenShake('heavy')
          setTimeout(() => setScreenShake(null), 350)
        } else if (t === 'card_play') {
          soundEngine.playCardPlay()
        } else if (t === 'turn_end') {
          soundEngine.playButtonClick()
        }
      }).then(() => setIsAiThinking(false))
    }
  }, [gameState?.currentTurn, gameState?.winner, screen, isMultiplayer])

  // LAN: applica le azioni dell'avversario allo stato condiviso (prospettiva invertita)
  useEffect(() => {
    const s = gameSocket.current
    if (!isMultiplayer || !s) return
    const handler = ({ action, payload }: any) => {
      if (action === 'play_card') {
        soundEngine.playCardPlay()
        setGameState((prev: any) => playCard(prev, !isHost, payload.cardInstanceId, payload.targetId))
      } else if (action === 'attack') {
        const targetKey = payload.targetType === 'hero' ? 'hero_player' : payload.targetInstanceId
        triggerCombatAnim(payload.attackerId, 'down', targetKey, 3)
        setGameState((prev: any) => attackTarget(prev, !isHost, payload.attackerId, payload.targetType, payload.targetInstanceId))
      } else if (action === 'end_turn') {
        soundEngine.playButtonClick()
        setGameState((prev: any) => endTurn(prev))
      }
    }
    s.on('opponent_action', handler)
    return () => { s.off('opponent_action', handler) }
  }, [isMultiplayer, isHost, screen])

  // Flash danno eroe + autoscroll log (dal punto di vista locale)
  useEffect(() => {
    if (!gameState) return
    const mine = meIsHost ? gameState.player : gameState.opponent
    const foes = meIsHost ? gameState.opponent : gameState.player
    if (mine.hp < prevHp.current.p) {
      const diff = prevHp.current.p - mine.hp
      setPFlash(true)
      triggerFloatingNumber('hero_player', `-${diff}`, '#f87171')
      setTimeout(() => setPFlash(false), 450)
    }
    if (foes.hp < prevHp.current.o) {
      const diff = prevHp.current.o - foes.hp
      setOFlash(true)
      triggerFloatingNumber('hero_opponent', `-${diff}`, '#f59e0b')
      setTimeout(() => setOFlash(false), 450)
    }
    prevHp.current = { p: mine.hp, o: foes.hp }
    if (logRef.current) logRef.current.scrollTop = 0
  }, [gameState, meIsHost])

  const p = gameState ? (meIsHost ? gameState.player : gameState.opponent) : null
  const o = gameState ? (meIsHost ? gameState.opponent : gameState.player) : null
  const isMyTurn = gameState ? (meIsHost ? gameState.currentTurn === 'player' : gameState.currentTurn === 'opponent') : false
  const winner = gameState?.winner || null
  const iWon = !!winner && (meIsHost ? winner === 'player' : winner === 'opponent')
  const enemyHasTaunt = o?.board ? o.board.some((m: any) => m.hasTaunt) : false
  // L'Eroe avversario è colpibile solo se non ci sono creature nemiche in campo
  const canHitFace = o?.board ? o.board.length === 0 : false
  // Carta da mostrare nel pannello a sinistra: evocazione recente ha priorità sull'hover
  const previewCard = summonPreview || inspectCard

  const emitAction = (action: string, payload: any) => {
    if (isMultiplayer && gameSocket.current) gameSocket.current.emit('game_action', { roomId: matchRoom, action, payload })
  }

  const onHandClick = (card: any) => {
    if (!p) return
    const effCost = getCardEffectiveCost(card, p)
    if (!isMyTurn || winner || p.mana < effCost) { if (isMyTurn && !winner) soundEngine.playDamage(); return }
    // Limite tavola: max 5 creature in campo
    if (card.type === 'CREATURA' && p.board.length >= 5) { soundEngine.playDamage(); return }

    // Suono o effetto magico speciale se la carta ha abilità
    if (card.abilityText && card.abilityText.length > 5) {
      if (/cur\w*|ripristin/i.test(card.abilityText)) {
        triggerHealFx('hero_player')
      } else {
        soundEngine.playMagicCast()
        triggerSpellFx('hero_player')
      }
    } else {
      soundEngine.playCardPlay()
    }

    setGameState(playCard(gameState, meIsHost, card.instanceId))
    setSelectedAttackerId(null)
    emitAction('play_card', { cardInstanceId: card.instanceId })
  }

  const onFriendlyClick = (m: any) => {
    if (!isMyTurn || winner || !m.canAttack) return
    soundEngine.playButtonClick()
    setSelectedAttackerId(prev => prev === m.instanceId ? null : m.instanceId)
  }

  const onAttack = (targetType: 'hero' | 'minion', targetId: string | null) => {
    if (!p || !isMyTurn || !selectedAttackerId || winner) return
    
    const attacker = p.board.find((m: any) => m.instanceId === selectedAttackerId)
    const targetKey = targetType === 'hero' ? 'hero_opponent' : (targetId || '')
    const dmg = attacker ? Math.max(1, attacker.atk) : 1
    
    // Attiva animazione di scatto, impatto e squarcio
    triggerCombatAnim(selectedAttackerId, 'up', targetKey, dmg)

    setGameState(attackTarget(gameState, meIsHost, selectedAttackerId, targetType, targetId))
    emitAction('attack', { attackerId: selectedAttackerId, targetType, targetInstanceId: targetId })
    setSelectedAttackerId(null)
  }

  const onEndTurn = () => {
    if (!isMyTurn || winner || isAiThinking) return
    soundEngine.playButtonClick()
    setSelectedAttackerId(null)
    setGameState(endTurn(gameState))
    emitAction('end_turn', {})
  }

  // Lista mista di creature attive e creature in dissolvenza di morte
  const oppBoardList = useMemo(() => {
    if (!o?.board) return []
    const activeList = o.board || []
    const activeIds = new Set(activeList.map((m: any) => m.instanceId))
    const dyingList = Object.values(dyingMinions).filter((m: any) => (m._side === 'opponent' || (!meIsHost ? m._side === 'player' : m._side === 'opponent')) && !activeIds.has(m.instanceId))
    return [...activeList, ...dyingList]
  }, [o?.board, dyingMinions, meIsHost])

  const playerBoardList = useMemo(() => {
    if (!p?.board) return []
    const activeList = p.board || []
    const activeIds = new Set(activeList.map((m: any) => m.instanceId))
    const dyingList = Object.values(dyingMinions).filter((m: any) => (m._side === 'player' || (meIsHost ? m._side === 'player' : m._side === 'opponent')) && !activeIds.has(m.instanceId))
    return [...activeList, ...dyingList]
  }, [p?.board, dyingMinions, meIsHost])

  if (screen === 'lobby' || !gameState || !p || !o) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 55% at 50% 0%, rgba(200,50,15,0.22) 0%, transparent 60%)' }} />
          <div className="glow-orb" style={{ position: 'absolute', left: '10%', top: '15%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(240,80,20,0.14) 0%, transparent 65%)', borderRadius: '50%' }} />
          <div className="glow-orb" style={{ position: 'absolute', right: '8%', top: '25%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(120,30,220,0.1) 0%, transparent 65%)', borderRadius: '50%', animationDelay: '1.5s' }} />
        </div>
        <div style={{ animation: 'slide-up 0.55s ease both', textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 2 }}>
          <div className="font-cinzel" style={{ fontSize: 10, letterSpacing: '0.5em', color: 'rgba(240,165,0,0.5)', textTransform: 'uppercase', marginBottom: 18 }}>Card Clash</div>
          <h2 className="font-cinzel-deco" style={{ fontSize: 'clamp(30px,5vw,60px)', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #f87171 0%, #f0a500 45%, #fde68a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.04em' }}>Arena di Battaglia</h2>
          <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(232,220,200,0.4)' }}>Motore reale · effetti & suoni · musica di battaglia</div>
        </div>

        {lobbyMode === 'menu' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', animation: 'slide-up 0.55s ease 0.12s both', position: 'relative', zIndex: 2 }}>
            <button onClick={startSolo} disabled={myDeck.deck.length < 2}
              style={{ width: 240, padding: '28px 24px', textAlign: 'left', background: 'linear-gradient(145deg, rgba(200,60,20,0.14) 0%, rgba(13,17,32,0.95) 100%)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 16, cursor: myDeck.deck.length < 2 ? 'not-allowed' : 'pointer', opacity: myDeck.deck.length < 2 ? 0.55 : 1, transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { if (myDeck.deck.length < 2) return; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.65)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(248,113,113,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(200,40,40,0.28))', border: '1px solid rgba(248,113,113,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.bot style={{ width: 24, height: 24, color: '#f87171' }} />
              </div>
              <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 8, letterSpacing: '0.05em' }}>Sfida l'IA</div>
              <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.5)', lineHeight: 1.55, marginBottom: 18 }}>
                {cards.length === 0
                  ? 'Nessuna carta pubblicata. Creale nel Card Creator Studio.'
                  : myDeck.source === 'deck'
                  ? `Giochi con il tuo mazzo (${myDeck.deck.length} carte). Abilità, suoni ed effetti attivi.`
                  : myDeck.source === 'owned'
                  ? `Nessun mazzo salvato: usi le tue ${myDeck.deck.length} carte possedute. Costruiscine uno nel Deck Builder.`
                  : `Non possiedi ancora carte: demo con tutte le ${myDeck.deck.length} pubblicate. Apri pacchetti e costruisci un mazzo!`}
              </div>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', fontSize: 9, color: '#f87171', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em' }}>
                {myDeck.deck.length < 2 ? 'SERVONO CARTE' : myDeck.source === 'deck' ? `MAZZO · ${myDeck.deck.length}` : myDeck.source === 'owned' ? `COLLEZIONE · ${myDeck.deck.length}` : `DEMO · ${myDeck.deck.length}`}
              </div>
            </button>
            <button onClick={() => { if (myDeck.deck.length >= 2) { soundEngine.playButtonClick(); setLobbyMode('lan') } }} disabled={myDeck.deck.length < 2}
              style={{ width: 240, padding: '28px 24px', textAlign: 'left', background: 'linear-gradient(145deg, rgba(96,165,250,0.1) 0%, rgba(13,17,32,0.95) 100%)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 16, cursor: myDeck.deck.length < 2 ? 'not-allowed' : 'pointer', opacity: myDeck.deck.length < 2 ? 0.55 : 1, transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { if (myDeck.deck.length < 2) return; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.65)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(96,165,250,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(40,90,200,0.28))', border: '1px solid rgba(96,165,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.trophy style={{ width: 24, height: 24, color: '#60a5fa' }} />
              </div>
              <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginBottom: 8, letterSpacing: '0.05em' }}>Sfida in rete (LAN)</div>
              <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.5)', lineHeight: 1.55, marginBottom: 18 }}>Ospita una stanza o unisciti a un collega sulla stessa rete locale. Combattimento sincronizzato.</div>
              <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', fontSize: 9, color: '#60a5fa', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em' }}>1 vs 1 · REALTIME</div>
            </button>
          </div>
        )}

        {lobbyMode === 'lan' && (
          <div style={{ width: 'min(560px, 92vw)', animation: 'slide-up 0.45s ease both', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(13,17,32,0.85)', border: '1px solid rgba(240,165,0,0.14)', borderRadius: 14, padding: '14px 16px' }}>
              <label className="font-cinzel" style={{ display: 'block', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,220,200,0.5)', marginBottom: 6 }}>Il tuo nome</label>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                style={{ width: '100%', background: '#06080f', border: '1px solid rgba(240,165,0,0.18)', borderRadius: 8, padding: '9px 12px', color: '#e8dcc8', fontSize: 13, outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* OSPITA */}
              <div style={{ background: 'rgba(13,17,32,0.85)', border: '1px solid rgba(240,165,0,0.16)', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="font-cinzel" style={{ fontSize: 12, fontWeight: 700, color: '#f0a500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ospita</div>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(232,220,200,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>IP del tuo server</div>
                  <div className="font-cinzel" style={{ fontSize: 13, fontWeight: 700, color: '#e8dcc8', marginTop: 2 }}>{hostIp}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(232,220,200,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Codice stanza</div>
                  <div className="font-cinzel" style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '0.25em', marginTop: 2 }}>{roomId}</div>
                </div>
                <button onClick={copyHostInfo} style={{ padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#6ee7b7' : 'rgba(232,220,200,0.6)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {copied ? <><Icon.check style={{ width: 12, height: 12 }} /> Copiato!</> : 'Copia dati per il collega'}
                </button>
                <button onClick={startHost} disabled={connecting}
                  className="font-cinzel" style={{ marginTop: 'auto', padding: '11px', borderRadius: 10, background: connecting ? 'rgba(240,165,0,0.15)' : 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: connecting ? '#f0a500' : '#06080f', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: connecting ? 'default' : 'pointer' }}>
                  {connecting && isHost ? '⏳ In attesa dell\'avversario…' : 'Crea stanza'}
                </button>
              </div>

              {/* UNISCITI */}
              <div style={{ background: 'rgba(13,17,32,0.85)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="font-cinzel" style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Unisciti</div>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(232,220,200,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>IP del PC host</div>
                  <input value={hostIp} onChange={e => setHostIp(e.target.value)} placeholder="192.168.1.x:4000"
                    style={{ width: '100%', background: '#06080f', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 8, padding: '8px 10px', color: '#e8dcc8', fontSize: 12, outline: 'none', fontFamily: 'Cinzel,serif' }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(232,220,200,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Codice stanza</div>
                  <input value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)} placeholder="0000" maxLength={4}
                    style={{ width: '100%', background: '#06080f', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 18, fontWeight: 800, textAlign: 'center', letterSpacing: '0.25em', outline: 'none', fontFamily: 'Cinzel,serif' }} />
                </div>
                {connError && <div style={{ fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '6px 8px' }}>⚠️ {connError}</div>}
                <button onClick={startJoin} disabled={connecting || !joinRoomId}
                  className="font-cinzel" style={{ marginTop: 'auto', padding: '11px', borderRadius: 10, background: (!joinRoomId || connecting) ? 'rgba(96,165,250,0.15)' : 'linear-gradient(135deg,#60a5fa,#3b82f6)', border: 'none', color: (!joinRoomId || connecting) ? 'rgba(96,165,250,0.6)' : '#06080f', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: (!joinRoomId || connecting) ? 'not-allowed' : 'pointer' }}>
                  {connecting && !isHost ? '⏳ Connessione…' : 'Collegati e gioca'}
                </button>
              </div>
            </div>

            <button onClick={() => { setLobbyMode('menu'); setConnError(null); setConnecting(false); if (gameSocket.current) { gameSocket.current.disconnect(); gameSocket.current = null } }}
              className="font-cinzel" style={{ alignSelf: 'center', padding: '8px 20px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(240,165,0,0.25)', color: 'rgba(232,220,200,0.55)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>← Indietro</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={screenShake ? (screenShake === 'heavy' ? 'shake-heavy' : 'shake-subtle') : ''}
      style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      
      {/* Turn Change Popup Banner */}
      {turnBanner && (
        <div className="turn-change-banner">
          <div style={{
            background: turnBanner.isPlayer
              ? 'linear-gradient(135deg, rgba(16,36,80,0.94), rgba(30,64,175,0.92))'
              : 'linear-gradient(135deg, rgba(80,16,16,0.94), rgba(185,28,28,0.92))',
            border: `2px solid ${turnBanner.isPlayer ? '#60a5fa' : '#f87171'}`,
            borderRadius: 24,
            padding: '16px 48px',
            boxShadow: `0 0 50px ${turnBanner.isPlayer ? 'rgba(96,165,250,0.6)' : 'rgba(248,113,113,0.6)'}, 0 20px 40px rgba(0,0,0,0.7)`,
            backdropFilter: 'blur(16px)',
            textAlign: 'center'
          }}>
            <div className="font-cinzel-deco" style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '0.14em',
              textShadow: '0 2px 14px rgba(0,0,0,0.8)'
            }}>
              {turnBanner.text}
            </div>
          </div>
        </div>
      )}

      {/* Sfondo Arena */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 130% 45% at 50% 0%, rgba(200,50,15,0.2) 0%, transparent 55%), radial-gradient(ellipse 130% 45% at 50% 100%, rgba(20,60,200,0.13) 0%, transparent 55%), linear-gradient(180deg, rgba(50,10,5,0.4) 0%, rgba(6,8,15,0.96) 25%, rgba(6,8,15,0.96) 75%, rgba(5,12,50,0.4) 100%)` }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(240,165,0,0.3) 30%, rgba(240,165,0,0.5) 50%, rgba(240,165,0,0.3) 70%, transparent 100%)', transform: 'translateY(-50%)' }} />
        <div className="glow-orb" style={{ position: 'absolute', left: '50%', top: '-5%', transform: 'translateX(-50%)', width: 700, height: 280, background: 'radial-gradient(ellipse, rgba(248,113,113,0.12) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div className="glow-orb" style={{ position: 'absolute', left: '50%', bottom: '-5%', transform: 'translateX(-50%)', width: 700, height: 280, background: 'radial-gradient(ellipse, rgba(96,165,250,0.1) 0%, transparent 65%)', borderRadius: '50%', animationDelay: '2s' }} />
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i * 23.7) % 100}%`, bottom: `${18 + (i * 11.3) % 65}%`, width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2, borderRadius: '50%', background: i % 3 === 0 ? 'rgba(240,165,0,0.55)' : i % 3 === 1 ? 'rgba(248,113,113,0.45)' : 'rgba(96,165,250,0.4)', animation: `particle-rise ${3 + (i % 5)}s ${i * 0.35}s linear infinite` }} />
        ))}
      </div>

      {/* Pannello lettura/anteprima carta (sinistra): hover o evocazione recente */}
      {previewCard && (
        <div key={summonPreview ? 'summon' : 'inspect'} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          width: 208, zIndex: 40, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(13,17,32,0.97), rgba(6,8,15,0.97))',
          border: `1px solid ${summonPreview ? 'rgba(240,165,0,0.55)' : 'rgba(240,165,0,0.22)'}`,
          borderRadius: 16, padding: 14,
          boxShadow: summonPreview ? '0 0 30px rgba(240,165,0,0.25), 0 20px 50px rgba(0,0,0,0.6)' : '0 20px 50px rgba(0,0,0,0.6)',
          animation: 'slide-up 0.25s ease both',
        }}>
          {summonPreview && (
            <div className="font-cinzel" style={{ fontSize: 9, color: '#f0a500', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>✦ Evocazione</div>
          )}
          <div style={{ height: 118, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            {previewCard.imageUrl
              ? <img src={previewCard.imageUrl} alt={previewCard.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Icon.sword style={{ width: 40, height: 40, color: '#6C8D88' }} />}
          </div>
          <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: previewCard.accentColor || rarInfo(previewCard.rarity).color, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6, textAlign: 'center', lineHeight: 1.15 }}>{previewCard.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8, fontSize: 12, color: 'rgba(232,220,200,0.75)', fontFamily: 'Cinzel,serif', fontWeight: 700 }}>
            <span style={{ color: '#60a5fa' }}>◈ {previewCard.cost}</span>
            {previewCard.type === 'CREATURA' && <>
              <span style={{ color: '#f87171' }}>⚔ {previewCard.atk}</span>
              <span style={{ color: '#4ade80' }}>♥ {previewCard.currentHp ?? previewCard.hp}</span>
            </>}
          </div>
          {previewCard.abilityTitle && (
            <div className="font-cinzel" style={{ fontSize: 9, color: previewCard.accentColor || '#f0a500', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>{previewCard.abilityTitle}</div>
          )}
          <div style={{ fontSize: 11.5, color: 'rgba(232,220,200,0.8)', lineHeight: 1.5, textAlign: 'center' }}>{previewCard.abilityText || 'Nessuna abilità.'}</div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2, overflow: 'hidden' }}>
        {/* Pile: Cimitero a sinistra, Mazzo a destra (del giocatore) */}
        <CardPile kind="grave" label="Cimitero" count={p.graveyard?.length || 0} pos={{ left: 12, bottom: 138 }} />
        <CardPile kind="deck" label="Mazzo" count={p.deck?.length || 0} pos={{ right: 12, bottom: 138 }} />

        {/* Top bar con controlli BGM / SFX */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0, background: 'rgba(6,8,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(240,165,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={leaveMatch} style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', cursor: 'pointer', fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: '0.06em' }}>← Abbandona</button>
            
            {/* Toggle Musica BGM */}
            <button onClick={() => { const active = soundEngine.toggleMusic(); setIsMusicOn(active) }}
              title="Attiva / Disattiva Musica di Sottofondo"
              style={{
                padding: '5px 12px', borderRadius: 8,
                background: isMusicOn ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isMusicOn ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', fontSize: 10, fontFamily: 'Cinzel,serif',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease'
              }}>
              {isMusicOn ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
                    <div className="eq-bar-1" style={{ width: 2.5, background: '#34d399', borderRadius: 1 }} />
                    <div className="eq-bar-2" style={{ width: 2.5, background: '#34d399', borderRadius: 1 }} />
                    <div className="eq-bar-3" style={{ width: 2.5, background: '#34d399', borderRadius: 1 }} />
                  </div>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>MUSICA ON</span>
                </>
              ) : (
                <span style={{ color: 'rgba(232,220,200,0.35)' }}>🔇 MUSICA OFF</span>
              )}
            </button>

            {/* Toggle SFX */}
            <button onClick={() => { const active = soundEngine.toggleSfx(); setIsSfxOn(active) }}
              title="Attiva / Disattiva Effetti Sonori"
              style={{
                padding: '5px 10px', borderRadius: 8,
                background: isSfxOn ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSfxOn ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', fontSize: 10, fontFamily: 'Cinzel,serif', color: isSfxOn ? '#60a5fa' : 'rgba(232,220,200,0.35)'
              }}>
              {isSfxOn ? '🔊 SFX' : '🔇 SFX'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="font-cinzel" style={{ fontSize: 10, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em' }}>TURNO {gameState.turnNumber}</div>
            <div style={{ padding: '5px 18px', borderRadius: 20, background: isMyTurn ? 'linear-gradient(135deg,rgba(96,165,250,0.2),rgba(59,130,246,0.1))' : 'linear-gradient(135deg,rgba(248,113,113,0.2),rgba(200,60,20,0.1))', border: `1px solid ${isMyTurn ? 'rgba(96,165,250,0.4)' : 'rgba(248,113,113,0.4)'}`, fontSize: 10, fontFamily: 'Cinzel,serif', fontWeight: 700, color: isMyTurn ? '#60a5fa' : '#f87171', letterSpacing: '0.08em' }}>
              {isMyTurn ? '⚔ IL TUO TURNO' : isAiThinking ? '⏳ AI PENSA…' : '⏳ AVVERSARIO'}
            </div>
          </div>

          <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMultiplayer && <span style={{ color: '#60a5fa', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em' }}>🌐 {matchRoom}</span>}
            <span>Mazzo: {p.deck.length}</span>
          </div>
        </div>

        {/* Eroe Avversario */}
        <HeroBar
          name={o.name}
          hp={o.hp}
          shield={o.shield}
          isOpponent
          flash={oFlash}
          hasSlash={!!slashTargets['hero_opponent']}
          hasSparks={!!sparksTargets['hero_opponent']}
          hasShieldBreak={!!shieldBreakTargets['hero_opponent']}
          hasSpell={!!spellTargets['hero_opponent']}
          hasHeal={!!healTargets['hero_opponent']}
          floatingText={floatingTexts['hero_opponent']}
        />

        {/* Campo avversario */}
        <div onClick={() => { if (selectedAttackerId && canHitFace) onAttack('hero', null) }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(240,165,0,0.05)', minHeight: 0, cursor: selectedAttackerId && canHitFace ? 'crosshair' : 'default' }}>
          {oppBoardList.length === 0 ? (
            <div style={{ color: 'rgba(232,220,200,0.12)', fontSize: 11, border: `1px dashed ${selectedAttackerId && canHitFace ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '14px 40px', background: selectedAttackerId && canHitFace ? 'rgba(248,113,113,0.05)' : 'transparent' }}>
              {selectedAttackerId ? "Clicca qui per colpire l'Eroe!" : 'Nessuna creatura nemica'}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {oppBoardList.map((m: any) => (
                <BoardMinion
                  key={m.instanceId}
                  minion={m}
                  side="opponent"
                  isTarget={!dyingMinions[m.instanceId] && !!selectedAttackerId && (!enemyHasTaunt || m.hasTaunt)}
                  isAttacking={animAttackerId === m.instanceId}
                  attackDir="down"
                  hasSlash={!!slashTargets[m.instanceId]}
                  hasSparks={!!sparksTargets[m.instanceId]}
                  hasShieldBreak={!!shieldBreakTargets[m.instanceId]}
                  hasSpell={!!spellTargets[m.instanceId]}
                  hasHeal={!!healTargets[m.instanceId]}
                  isDying={!!dyingMinions[m.instanceId]}
                  floatingText={floatingTexts[m.instanceId]}
                  onInspect={setInspectCard}
                  onClick={(e: any) => { e.stopPropagation?.(); if (selectedAttackerId && !dyingMinions[m.instanceId]) onAttack('minion', m.instanceId) }}
                />
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
          {playerBoardList.length === 0 ? (
            <div style={{ color: 'rgba(232,220,200,0.12)', fontSize: 11, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 40px' }}>Gioca una carta per evocarla</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {playerBoardList.map((m: any) => (
                <BoardMinion
                  key={m.instanceId}
                  minion={m}
                  side="player"
                  selectable={!dyingMinions[m.instanceId] && isMyTurn && m.canAttack}
                  isSelected={selectedAttackerId === m.instanceId}
                  isAttacking={animAttackerId === m.instanceId}
                  attackDir="up"
                  hasSlash={!!slashTargets[m.instanceId]}
                  hasSparks={!!sparksTargets[m.instanceId]}
                  hasShieldBreak={!!shieldBreakTargets[m.instanceId]}
                  hasSpell={!!spellTargets[m.instanceId]}
                  hasHeal={!!healTargets[m.instanceId]}
                  isDying={!!dyingMinions[m.instanceId]}
                  floatingText={floatingTexts[m.instanceId]}
                  onInspect={setInspectCard}
                  onClick={() => { if (!dyingMinions[m.instanceId]) onFriendlyClick(m) }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Eroe Giocatore */}
        <HeroBar
          name={`${p.name} (Tu)`}
          hp={p.hp}
          shield={p.shield}
          isOpponent={false}
          flash={pFlash}
          hasSlash={!!slashTargets['hero_player']}
          hasSparks={!!sparksTargets['hero_player']}
          hasShieldBreak={!!shieldBreakTargets['hero_player']}
          hasSpell={!!spellTargets['hero_player']}
          hasHeal={!!healTargets['hero_player']}
          floatingText={floatingTexts['hero_player']}
          mana={p.mana}
          maxMana={p.maxMana}
        />

        {/* Mano a ventaglio */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '30px 16px 8px', flexShrink: 0, gap: 0, flexWrap: 'nowrap', overflow: 'visible', background: 'rgba(6,8,15,0.7)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(240,165,0,0.06)', minHeight: 120 }}>
          {p.hand.length === 0 && <div style={{ alignSelf: 'center', fontSize: 11, color: 'rgba(232,220,200,0.15)' }}>Mano vuota</div>}
          {p.hand.map((card: any, i: number) => {
            const effCost = getCardEffectiveCost(card, p)
            const isDiscounted = effCost < card.cost
            const affordable = isMyTurn && !winner && p.mana >= effCost
            return (
              <HandCard
                key={card.instanceId}
                card={card}
                index={i}
                total={p.hand.length}
                onInspect={setInspectCard}
                effectiveCost={effCost}
                isDiscounted={isDiscounted}
                affordable={affordable}
                onClick={() => onHandClick(card)}
              />
            )
          })}
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

      {/* Avversario disconnesso (solo LAN) */}
      {oppLeft && !winner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease both' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-cinzel-deco" style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 700, color: '#f87171', marginBottom: 12 }}>Avversario disconnesso</div>
            <div style={{ fontSize: 14, color: 'rgba(232,220,200,0.5)', marginBottom: 32 }}>Il collega ha lasciato la partita.</div>
            <button onClick={leaveMatch} className="btn-primary font-cinzel" style={{ padding: '13px 36px', borderRadius: 12, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Torna al Menu</button>
          </div>
        </div>
      )}

      {/* Menu di gioco (ESC): impostazioni + arrenditi */}
      {menuOpen && !winner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease both' }}
          onClick={() => setMenuOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 340, background: 'linear-gradient(180deg, rgba(13,17,32,0.98), rgba(6,8,15,0.98))', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 18, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <div className="font-cinzel-deco" style={{ fontSize: 22, fontWeight: 700, color: '#f0a500', textAlign: 'center', letterSpacing: '0.06em', marginBottom: 18 }}>Menu</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(232,220,200,0.6)', marginBottom: 6 }}>
                <span>Volume Musica</span><span>{Math.round(musicVol * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={musicVol}
                onChange={e => { const v = parseFloat(e.target.value); setMusicVol(v); soundEngine.setMusicVolume?.(v) }}
                style={{ width: '100%', accentColor: '#f0a500' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <button onClick={() => { const a = soundEngine.toggleMusic(); setIsMusicOn(a) }} className="font-cinzel"
                style={{ flex: 1, padding: '9px', borderRadius: 10, background: isMusicOn ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isMusicOn ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)'}`, color: isMusicOn ? '#60a5fa' : 'rgba(232,220,200,0.4)', fontSize: 11, cursor: 'pointer' }}>
                Musica {isMusicOn ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => { const a = soundEngine.toggleSfx(); setIsSfxOn(a) }} className="font-cinzel"
                style={{ flex: 1, padding: '9px', borderRadius: 10, background: isSfxOn ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSfxOn ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)'}`, color: isSfxOn ? '#60a5fa' : 'rgba(232,220,200,0.4)', fontSize: 11, cursor: 'pointer' }}>
                SFX {isSfxOn ? 'ON' : 'OFF'}
              </button>
            </div>

            <button onClick={() => setMenuOpen(false)} className="btn-primary font-cinzel"
              style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10 }}>
              Riprendi
            </button>
            <button onClick={leaveMatch} className="font-cinzel"
              style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Arrenditi
            </button>
          </div>
        </div>
      )}

      {/* Game over */}
      {winner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease both' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-cinzel-deco" style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, color: iWon ? '#ffd700' : winner === 'draw' ? '#e8dcc8' : '#f87171', textShadow: iWon ? '0 0 60px rgba(255,215,0,0.55)' : '0 0 60px rgba(248,113,113,0.45)', marginBottom: 12 }}>
              {iWon ? 'Vittoria!' : winner === 'draw' ? 'Pareggio' : 'Sconfitta'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(232,220,200,0.5)', marginBottom: 20 }}>
              {iWon ? "Hai annientato l'Eroe avversario!" : winner === 'draw' ? 'Entrambi gli Eroi sono caduti.' : 'I tuoi HP sono a zero. Riprova!'}
            </div>

            {/* Badge Ricompensa Monete */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.4)', borderRadius: 20, color: '#f0a500', fontFamily: 'Cinzel, serif', fontWeight: 800, fontSize: 13, marginBottom: 28, boxShadow: '0 0 20px rgba(240,165,0,0.3)' }}>
              <span>🪙</span> Ricompensa Partita: {iWon ? '+150 Monete' : '+30 Monete'}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {!isMultiplayer && (
                <button onClick={startSolo} className="btn-primary font-cinzel" style={{ padding: '13px 36px', borderRadius: 12, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 28px rgba(240,165,0,0.4)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.sword style={{ width: 13, height: 13 }} /> Rivincita</span>
                </button>
              )}
              <button onClick={leaveMatch} className="font-cinzel" style={{ padding: '13px 28px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(240,165,0,0.3)', color: 'rgba(232,220,200,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

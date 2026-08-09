import { useState, useMemo, useEffect } from 'react'
import { Icon } from '../NewUI'
import { useRealCards, RealCardTile, RealBigCard, rarInfo } from '../realCards'
import { usePlayerInventory, usePlayerEconomy, getCardLevelInfo, applyCardLevelStats } from '../playerState'
import { soundEngine } from '../../engine/soundEngine'

const DECK_KEY = 'card_clash_newui_deck_v1'
const maxCopiesByRarity = (c: any) => (c?.rarity === 'legendary' || c?.rarity === 'mythic') ? 1 : 2

export function RealDeckBuilder() {
  const { cards, loaded } = useRealCards()
  const { inventory, cardLevels, upgradeCard } = usePlayerInventory()
  const { gold } = usePlayerEconomy()
  const [search, setSearch] = useState('')
  const [fType, setFType] = useState<string>('tutti')
  const [deck, setDeck] = useState<Record<string, number>>({})
  const [deckName, setDeckName] = useState('Mazzo Principale')
  const [saved, setSaved] = useState(false)
  const [inspectCard, setInspectCard] = useState<any | null>(null)
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)

  // Calcola il limite massimo di copie per una carta specifica (minore tra regola e copie possedute)
  const maxAllowed = (c: any) => {
    if (!c || !c.id) return 0
    const ruleLimit = maxCopiesByRarity(c)
    const owned = inventory[c.id] || 0
    return Math.min(ruleLimit, owned)
  }

  // Carica mazzo salvato filtrando solo le carte effettivamente possedute
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DECK_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.counts && typeof d.counts === 'object') {
          const validatedCounts: Record<string, number> = {}
          for (const [id, count] of Object.entries(d.counts)) {
            const owned = inventory[id] || 0
            if (owned > 0 && typeof count === 'number' && count > 0) {
              validatedCounts[id] = Math.min(count, owned)
            }
          }
          setDeck(validatedCounts)
        }
        if (d.name) setDeckName(d.name)
      }
    } catch {}
  }, [inventory])

  // Mappa delle carte con statistiche di livello aggiornate
  const byId = useMemo(() => {
    return Object.fromEntries(
      cards.map(c => [c.id, applyCardLevelStats(c, cardLevels[c.id] || 1)])
    )
  }, [cards, cardLevels])

  // Filtra SOLO le carte possedute dal giocatore con statistiche di livello applicate
  const ownedCards = useMemo(() => {
    return cards
      .filter(c => (inventory[c.id] || 0) > 0)
      .map(c => applyCardLevelStats(c, cardLevels[c.id] || 1))
  }, [cards, inventory, cardLevels])

  const add = (c: any) => {
    const max = maxAllowed(c)
    setDeck(d => {
      const cur = d[c.id] ?? 0
      if (cur >= max) return d
      if (Object.values(d).reduce((a, b) => a + b, 0) >= 30) return d
      soundEngine.playCardFlip()
      return { ...d, [c.id]: cur + 1 }
    })
  }

  const remove = (id: string) => {
    setDeck(d => {
      const cur = d[id] ?? 0
      if (cur <= 0) return d
      soundEngine.playButtonClick()
      const next = { ...d, [id]: cur - 1 }
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  const filtered = useMemo(() => ownedCards.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (fType !== 'tutti' && c.type !== fType) return false
    return true
  }), [ownedCards, search, fType])

  const total = Object.values(deck).reduce((a, b) => a + b, 0)
  const deckList = Object.keys(deck).map(id => byId[id]).filter(Boolean).sort((a, b) => a.cost - b.cost)
  const curve = Array.from({ length: 8 }, (_, i) => deckList.filter(c => i < 7 ? c.cost === i : c.cost >= 7).reduce((s, c) => s + (deck[c.id] || 0), 0))
  const maxCurve = Math.max(...curve, 1)
  const types = Array.from(new Set(ownedCards.map(c => c.type)))

  const saveDeck = () => {
    try { localStorage.setItem(DECK_KEY, JSON.stringify({ name: deckName, counts: deck })) } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleUpgradeInModal = (card: any) => {
    const res = upgradeCard(card)
    if (res.success) {
      soundEngine.playLevelUp()
      setUpgradeMessage(`✨ Potenziata a Livello ${res.newLevel}!`)
      setTimeout(() => setUpgradeMessage(null), 2500)
    }
  }

  const inspectLvlInfo = inspectCard ? getCardLevelInfo(inspectCard, inventory, gold) : null
  const inspectCardWithStats = inspectCard ? applyCardLevelStats(inspectCard, inspectLvlInfo?.level) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#06080f' }}>
      
      {/* Modale Dettaglio / Potenziamento Rapido dentro il Deck Builder */}
      {inspectCard && inspectLvlInfo && inspectCardWithStats && (
        <div onClick={() => setInspectCard(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 28, alignItems: 'center', background: 'rgba(10,13,22,0.98)', border: '1.5px solid rgba(240,165,0,0.3)', borderRadius: 20, padding: '24px', maxWidth: 760, width: '92%', boxShadow: '0 20px 50px rgba(0,0,0,0.85)' }}>
            
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <RealBigCard card={inspectCardWithStats} />
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1.5px solid #38bdf8',
                borderRadius: 12,
                padding: '4px 10px',
                color: '#38bdf8',
                fontFamily: 'Cinzel, serif',
                fontSize: 12,
                fontWeight: 900,
                boxShadow: '0 0 16px rgba(56,189,248,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                zIndex: 40,
              }}>
                <span style={{ color: '#f0a500' }}>★</span>
                <span>LIV. {inspectLvlInfo.level}</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="font-cinzel" style={{ fontSize: 20, fontWeight: 800, color: '#f0a500', marginBottom: 4 }}>
                {inspectCard.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.5)', marginBottom: 14 }}>
                {inspectCard.type} · Livello Attuale {inspectLvlInfo.level}
              </div>

              {/* Box Clash Royale Upgrade */}
              <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="font-cinzel" style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>
                    ⚡ Potenziamento Carta
                  </span>
                  <span className="font-cinzel" style={{ fontSize: 11, color: '#e8dcc8', fontWeight: 700 }}>
                    {inspectLvlInfo.maxLevelReached ? 'LIVELLO MAX' : `Liv. ${inspectLvlInfo.level} ➔ Liv. ${inspectLvlInfo.level + 1}`}
                  </span>
                </div>

                {!inspectLvlInfo.maxLevelReached && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(232,220,200,0.6)', marginBottom: 4 }}>
                      <span>Copie doppie accumulate</span>
                      <strong style={{ color: inspectLvlInfo.availableDuplicateCopies >= inspectLvlInfo.requiredCopies ? '#10b981' : '#f0a500' }}>
                        {inspectLvlInfo.availableDuplicateCopies} / {inspectLvlInfo.requiredCopies}
                      </strong>
                    </div>
                    <div style={{ height: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${inspectLvlInfo.progressPercent}%`,
                        height: '100%',
                        background: inspectLvlInfo.availableDuplicateCopies >= inspectLvlInfo.requiredCopies
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                      }} />
                    </div>
                  </div>
                )}

                {inspectCard.type === 'CREATURA' && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8, color: 'rgba(232,220,200,0.4)' }}>ATTACCO</div>
                      <div className="font-cinzel" style={{ fontSize: 13, fontWeight: 800, color: '#f87171' }}>
                        {inspectLvlInfo.effectiveAtk}
                        {!inspectLvlInfo.maxLevelReached && (
                          <span style={{ color: '#10b981', fontSize: 11, marginLeft: 3 }}>➔ {inspectLvlInfo.nextEffectiveAtk}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8, color: 'rgba(232,220,200,0.4)' }}>SALUTE (HP)</div>
                      <div className="font-cinzel" style={{ fontSize: 13, fontWeight: 800, color: '#4ade80' }}>
                        {inspectLvlInfo.effectiveHp}
                        {!inspectLvlInfo.maxLevelReached && (
                          <span style={{ color: '#10b981', fontSize: 11, marginLeft: 3 }}>➔ {inspectLvlInfo.nextEffectiveHp}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!inspectLvlInfo.maxLevelReached ? (
                  <button
                    onClick={() => handleUpgradeInModal(inspectCard)}
                    disabled={!inspectLvlInfo.canUpgrade}
                    className="font-cinzel"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: inspectLvlInfo.canUpgrade ? '1.5px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                      background: inspectLvlInfo.canUpgrade ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.04)',
                      color: inspectLvlInfo.canUpgrade ? '#fff' : 'rgba(232,220,200,0.35)',
                      fontSize: 10.5,
                      fontWeight: 800,
                      cursor: inspectLvlInfo.canUpgrade ? 'pointer' : 'not-allowed',
                      boxShadow: inspectLvlInfo.canUpgrade ? '0 0 12px rgba(16,185,129,0.5)' : 'none',
                    }}
                  >
                    {inspectLvlInfo.canUpgrade
                      ? `⚡ MIGLIORA A LIV. ${inspectLvlInfo.level + 1} (${inspectLvlInfo.upgradeCost} 🪙)`
                      : inspectLvlInfo.availableDuplicateCopies < inspectLvlInfo.requiredCopies
                      ? `🔒 Servono altre ${inspectLvlInfo.requiredCopies - inspectLvlInfo.availableDuplicateCopies} copie`
                      : `🪙 Monete insufficienti (${gold}/${inspectLvlInfo.upgradeCost} 🪙)`}
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', color: '#f0a500', fontSize: 10, fontFamily: 'Cinzel, serif', fontWeight: 800 }}>
                    👑 LIVELLO MASSIMO RAGGIUNTO
                  </div>
                )}

                {upgradeMessage && (
                  <div style={{ marginTop: 6, textAlign: 'center', color: '#10b981', fontSize: 10.5, fontFamily: 'Cinzel, serif', fontWeight: 800 }}>
                    {upgradeMessage}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    add(inspectCardWithStats)
                    setInspectCard(null)
                  }}
                  className="font-cinzel"
                  style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'linear-gradient(135deg,#f0a500,#d4842a)', border: 'none', color: '#06080f', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                >
                  + Aggiungi al Mazzo
                </button>
                <button
                  onClick={() => setInspectCard(null)}
                  className="font-cinzel"
                  style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(232,220,200,0.6)', fontSize: 11, cursor: 'pointer' }}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalogo Carte Possedute */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid rgba(240,165,0,0.08)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(240,165,0,0.08)', background: 'rgba(6,8,15,0.9)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="font-cinzel" style={{ fontSize: 18, fontWeight: 700, color: '#e8dcc8', letterSpacing: '0.06em' }}>Le Tue Carte Sbloccate</div>
              <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', marginTop: 2 }}>
                {ownedCards.length} carte uniche nel baule · Clicca per aggiungere al mazzo (tieni premuto o ispeziona per migliorare)
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 20, fontSize: 11, color: '#f0a500', fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
              Collezione: {ownedCards.length}/{cards.length}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
              <Icon.search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(232,220,200,0.3)', pointerEvents: 'none' }} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Cerca nelle tue carte..."
                style={{ width: '100%', padding: '8px 10px 8px 32px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: 8, color: '#e8dcc8', fontSize: 12, outline: 'none' }} 
              />
            </div>
            {types.length > 1 && (
              <select 
                value={fType} 
                onChange={e => setFType(e.target.value)} 
                style={{ padding: '8px 12px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: 8, color: 'rgba(232,220,200,0.8)', fontSize: 11, outline: 'none', cursor: 'pointer' }}
              >
                <option value="tutti">Tutti i tipi ({ownedCards.length})</option>
                {types.map(t => (
                  <option key={t} value={t}>
                    {String(t).toLowerCase()} ({ownedCards.filter(c => c.type === t).length})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 18, alignContent: 'flex-start' }}>
          {loaded && ownedCards.length === 0 && (
            <div style={{ width: '100%', padding: '60px 20px', textAlign: 'center', color: 'rgba(232,220,200,0.4)', fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon.cards style={{ width: 28, height: 28, color: '#f0a500' }} />
              </div>
              <div className="font-cinzel" style={{ fontSize: 16, fontWeight: 700, color: '#e8dcc8', marginBottom: 6 }}>
                Nessuna Carta nel Baule
              </div>
              <div style={{ maxWidth: 420, margin: '0 auto' }}>
                Non possiedi ancora carte per comporre un mazzo.<br />
                Visita la sezione <strong style={{ color: '#f0a500' }}>Negozio / Pacchetti</strong> per aprire le bustine de <em>Gli Elettronici</em> e trovare le tue prime carte!
              </div>
            </div>
          )}

          {loaded && ownedCards.length > 0 && filtered.length === 0 && (
            <div style={{ width: '100%', padding: '40px 20px', textAlign: 'center', color: 'rgba(232,220,200,0.35)', fontSize: 12 }}>
              Nessuna carta trovata con i filtri selezionati.
            </div>
          )}

          {filtered.map(card => {
            const cnt = deck[card.id] ?? 0
            const ownedQty = inventory[card.id] || 0
            const max = maxAllowed(card)
            const isMaxed = cnt >= max
            const lvlInfo = getCardLevelInfo(card, inventory, gold)
            
            return (
              <div key={card.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RealCardTile 
                  card={card} 
                  level={lvlInfo.level}
                  canUpgrade={lvlInfo.canUpgrade}
                  copiesProgress={!lvlInfo.maxLevelReached ? { current: lvlInfo.availableDuplicateCopies, max: lvlInfo.requiredCopies } : undefined}
                  onClick={() => add(card)} 
                  dimmed={isMaxed} 
                  badge={cnt > 0 ? `${cnt}/${ownedQty}` : `×${ownedQty}`} 
                />
                
                {/* Tasto rapido Ispezione / Upgrade sotto la carta */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setInspectCard(card)
                    soundEngine.playButtonClick()
                  }}
                  style={{
                    marginTop: 18,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: lvlInfo.canUpgrade ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${lvlInfo.canUpgrade ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                    color: lvlInfo.canUpgrade ? '#10b981' : 'rgba(232,220,200,0.6)',
                    fontSize: 9,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span>{lvlInfo.canUpgrade ? '⚡' : '🔍'}</span>
                  <span>{lvlInfo.canUpgrade ? 'Migliora' : 'Dettagli'}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pannello Mazzo */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(8,10,18,0.95)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(240,165,0,0.08)' }}>
          <div className="font-cinzel" style={{ fontSize: 11, fontWeight: 600, color: 'rgba(232,220,200,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Mazzo</div>
          <input 
            value={deckName} 
            onChange={e => setDeckName(e.target.value)} 
            className="font-cinzel"
            style={{ width: '100%', padding: '8px 12px', background: 'rgba(13,17,32,0.6)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: 8, color: '#f0a500', fontSize: 14, fontWeight: 700, outline: 'none', letterSpacing: '0.04em' }} 
          />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.6)' }}>
              <span style={{ color: '#f0a500', fontWeight: 600 }}>{total}</span>
              <span style={{ color: 'rgba(232,220,200,0.3)' }}> / 30 carte</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.35)' }}>{deckList.length} uniche</div>
          </div>
          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, (total / 30) * 100)}%`, background: 'linear-gradient(90deg,#f0a500,#d4842a)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Curva del Mana */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(240,165,0,0.08)' }}>
          <div className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: 'rgba(232,220,200,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Curva del Mana</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 52 }}>
            {curve.map((count, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', height: count > 0 ? `${Math.max((count / maxCurve) * 40, 4)}px` : '2px', borderRadius: '3px 3px 0 0', background: count > 0 ? 'linear-gradient(to top,#3b82f6,#60a5fa)' : 'rgba(255,255,255,0.06)', transition: 'height 0.3s ease' }} />
                <div style={{ fontSize: 8, color: 'rgba(232,220,200,0.4)', fontFamily: 'Cinzel,serif' }}>{i < 7 ? i : '7+'}</div>
                {count > 0 && <div style={{ fontSize: 7, color: '#60a5fa', fontWeight: 600 }}>{count}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Lista Carte nel Mazzo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {deckList.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(232,220,200,0.25)', fontSize: 12, lineHeight: 1.6 }}>
              <Icon.layers style={{ width: 28, height: 28, margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              Clicca le tue carte a sinistra per aggiungerle al mazzo
            </div>
          )}
          {deckList.map(card => {
            const rar = rarInfo(card.rarity)
            const accent = card.accentColor || '#f0a500'
            const ownedQty = inventory[card.id] || 0
            const max = maxAllowed(card)
            const currentInDeck = deck[card.id] ?? 0
            const canAddMore = currentInDeck < max && total < 30
            const cardLvl = card.level || 1

            return (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: 'rgba(255,255,255,0.02)' }}>
                <div className="font-cinzel" style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {card.cost}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {card.name}
                    </span>
                    {cardLvl > 1 && (
                      <span style={{ fontSize: 8, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 4, padding: '0 3px', fontWeight: 800 }}>
                        ★{cardLvl}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(232,220,200,0.4)', marginTop: 1, display: 'flex', gap: 6 }}>
                    <span style={{ color: rar.color }}>{rar.label}</span>
                    {card.type === 'CREATURA' && (
                      <span>⚔{card.atk} ♥{card.hp}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button 
                    onClick={() => remove(card.id)} 
                    style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 14, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    −
                  </button>
                  <span className="font-cinzel" style={{ fontSize: 11, fontWeight: 700, color: '#f0a500', minWidth: 14, textAlign: 'center' }}>
                    ×{currentInDeck}
                  </span>
                  <button 
                    onClick={() => add(card)} 
                    disabled={!canAddMore} 
                    style={{ 
                      width: 18, 
                      height: 18, 
                      borderRadius: '50%', 
                      background: canAddMore ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)', 
                      border: `1px solid ${canAddMore ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`, 
                      color: canAddMore ? '#4ade80' : 'rgba(255,255,255,0.2)', 
                      fontSize: 14, 
                      lineHeight: 1, 
                      cursor: canAddMore ? 'pointer' : 'not-allowed', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(240,165,0,0.08)' }}>
          <button 
            onClick={saveDeck} 
            disabled={total === 0} 
            className="btn-primary font-cinzel"
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: total > 0 ? 'linear-gradient(135deg,#f0a500,#d4842a)' : 'rgba(255,255,255,0.06)', border: 'none', color: total > 0 ? '#06080f' : 'rgba(232,220,200,0.3)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: total > 0 ? 'pointer' : 'not-allowed' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon.check style={{ width: 14, height: 14 }} />{saved ? 'Mazzo Salvato!' : total === 0 ? 'Aggiungi carte' : 'Salva Mazzo'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

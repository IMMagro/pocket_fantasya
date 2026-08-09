import { useState, useEffect, useMemo } from 'react'
import { Icon } from '../NewUI'
import { useRealCards, RealCardTile, RealBigCard, LockedCardTile, REAL_RARITY, rarInfo } from '../realCards'
import { usePlayerInventory, usePlayerEconomy, getCardLevelInfo, applyCardLevelStats, getBaseCardKey, getBaseCardName } from '../playerState'
import { soundEngine } from '../../engine/soundEngine'

const RARITY_ORDER: Record<string, number> = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 }
const RARITIES = ['mythic', 'legendary', 'epic', 'rare', 'common']

const VARIANT_ORDER: Record<string, number> = {
  standard: 0,
  holo: 1,
  gold_foil: 2,
  full_art: 3,
  secret_holo: 4,
  out: 5,
}

const VARIANT_LABELS: Record<string, { label: string; icon: string }> = {
  standard: { label: 'Classica', icon: '📜' },
  holo: { label: 'Holo', icon: '✨' },
  gold_foil: { label: 'Gold Foil', icon: '🌟' },
  full_art: { label: 'Full-Art', icon: '🎨' },
  secret_holo: { label: 'Secret Rare', icon: '👑' },
  out: { label: 'OUT', icon: '🌌' },
}

interface BaseCardGroup {
  baseKey: string
  baseName: string
  number: number
  variants: any[]
  ownedVariants: any[]
  isDiscovered: boolean
  totalQuantity: number
  displayCard: any
}

function DetailModal({ 
  group, 
  onClose 
}: { 
  group: BaseCardGroup
  onClose: () => void 
}) {
  const { inventory, hasCard, getCardQuantity, upgradeCard } = usePlayerInventory()
  const { gold } = usePlayerEconomy()
  const [levelUpSuccess, setLevelUpSuccess] = useState(false)
  
  // Trova la prima variante posseduta, oppure la standard
  const initialVariant = useMemo(() => {
    return group.ownedVariants[0] || group.variants[0]
  }, [group])

  const [selectedVariant, setSelectedVariant] = useState<any>(initialVariant)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const isSelectedOwned = hasCard(selectedVariant.id)
  const ownedQty = getCardQuantity(selectedVariant.id)
  const rar = rarInfo(selectedVariant.rarity)
  const varMeta = VARIANT_LABELS[selectedVariant.variant || 'standard'] || { label: 'Standard', icon: '📜' }

  // Calcolo dati livello e progressione
  const lvlInfo = useMemo(() => {
    return getCardLevelInfo(selectedVariant, inventory, gold)
  }, [selectedVariant, inventory, gold])

  const cardWithLevel = useMemo(() => {
    return applyCardLevelStats(selectedVariant, lvlInfo.level)
  }, [selectedVariant, lvlInfo.level])

  const handleUpgrade = () => {
    const res = upgradeCard(selectedVariant)
    if (res.success) {
      soundEngine.playLevelUp()
      setLevelUpSuccess(true)
      setTimeout(() => setLevelUpSuccess(false), 2500)
    }
  }

  const isCreature = (selectedVariant.type || 'CREATURA').toUpperCase() === 'CREATURA'

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 32, alignItems: 'center', animation: 'slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) both', maxWidth: 880, width: '94%', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Anteprima Carta (Grande con statistiche potenziate o Sagoma Bloccata) */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {isSelectedOwned ? (
            <div style={{ position: 'relative' }}>
              <RealBigCard card={cardWithLevel} />
              
              {/* Badge Livello Grande in alto */}
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
                <span>LIV. {lvlInfo.level}</span>
              </div>
            </div>
          ) : (
            <LockedCardTile 
              size="lg" 
              name={`${group.baseName} (${varMeta.label})`} 
              number={group.number} 
            />
          )}
        </div>

        {/* Scheda Dettagli & Upgrade Stile Clash Royale */}
        <div style={{ flex: 1, background: 'rgba(10,13,22,0.96)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 20, padding: '24px 22px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div className="font-cinzel" style={{ fontSize: (isSelectedOwned ? selectedVariant.name : group.baseName).length > 22 ? 16 : 20, fontWeight: 800, color: isSelectedOwned ? (selectedVariant.accentColor || rar.color) : 'rgba(232,220,200,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                {isSelectedOwned ? selectedVariant.name : `??? - ${group.baseName}`}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{selectedVariant.type}</span>
                <span>•</span>
                <span>Carta #{String(group.number).padStart(2, '0')}</span>
                {isSelectedOwned && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>Livello {lvlInfo.level}</span>
                  </>
                )}
              </div>
            </div>
            {isSelectedOwned && (
              <div style={{ padding: '4px 12px', background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.4)', borderRadius: 12, fontSize: 11, color: '#f0a500', fontFamily: 'Cinzel, serif', fontWeight: 800 }}>
                Copie: ×{ownedQty}
              </div>
            )}
          </div>

          {/* Selettore Varianti */}
          <div style={{ marginTop: 12, marginBottom: 14 }}>
            <div className="font-cinzel" style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(232,220,200,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Varianti ({group.ownedVariants.length}/{group.variants.length} Trovate)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {group.variants.map(v => {
                const owned = hasCard(v.id)
                const isCur = v.id === selectedVariant.id
                const meta = VARIANT_LABELS[v.variant || 'standard'] || { label: 'Classica', icon: '📜' }
                const vQty = getCardQuantity(v.id)
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v)
                      soundEngine.playButtonClick()
                    }}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 8,
                      border: isCur 
                        ? '1px solid #f0a500' 
                        : owned 
                        ? '1px solid rgba(255,255,255,0.1)' 
                        : '1px dashed rgba(255,255,255,0.06)',
                      background: isCur 
                        ? 'rgba(240,165,0,0.2)' 
                        : owned 
                        ? 'rgba(255,255,255,0.04)' 
                        : 'rgba(0,0,0,0.4)',
                      color: isCur ? '#f0a500' : owned ? '#e8dcc8' : 'rgba(232,220,200,0.25)',
                      fontSize: 10,
                      fontFamily: 'Cinzel, serif',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    {owned ? (
                      <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>(×{vQty})</span>
                    ) : (
                      <span style={{ fontSize: 9, opacity: 0.4, marginLeft: 2 }}>🔒</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {isSelectedOwned ? (
            <>
              {/* ================= SEZIONE POTENZIAMENTO CLASH ROYALE ================= */}
              <div style={{
                background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))',
                border: '1.5px solid rgba(56,189,248,0.3)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>⚡</span>
                    <span className="font-cinzel" style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Progresso Livello Carta
                    </span>
                  </div>
                  <div className="font-cinzel" style={{ fontSize: 11, fontWeight: 800, color: lvlInfo.maxLevelReached ? '#f0a500' : '#e8dcc8' }}>
                    {lvlInfo.maxLevelReached ? '★ LIVELLO MAX' : `Liv. ${lvlInfo.level} ➔ Liv. ${lvlInfo.level + 1}`}
                  </div>
                </div>

                {/* Barra di Progresso Copie */}
                {!lvlInfo.maxLevelReached && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'Cinzel, serif', color: 'rgba(232,220,200,0.6)', marginBottom: 4 }}>
                      <span>Copie doppie per il potenziamento</span>
                      <strong style={{ color: lvlInfo.availableDuplicateCopies >= lvlInfo.requiredCopies ? '#10b981' : '#f0a500' }}>
                        {lvlInfo.availableDuplicateCopies} / {lvlInfo.requiredCopies} Copie
                      </strong>
                    </div>
                    <div style={{ height: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                      <div style={{
                        width: `${lvlInfo.progressPercent}%`,
                        height: '100%',
                        background: lvlInfo.availableDuplicateCopies >= lvlInfo.requiredCopies
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )}

                {/* Confronto Statistiche Potenziate */}
                {isCreature && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {/* ATK */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8.5, color: 'rgba(232,220,200,0.4)', letterSpacing: '0.06em' }}>ATTACCO</div>
                      <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>
                        {lvlInfo.effectiveAtk}
                        {!lvlInfo.maxLevelReached && lvlInfo.nextEffectiveAtk > lvlInfo.effectiveAtk && (
                          <span style={{ color: '#10b981', fontSize: 12, marginLeft: 4 }}>➔ {lvlInfo.nextEffectiveAtk} (+1)</span>
                        )}
                      </div>
                    </div>

                    {/* HP */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8.5, color: 'rgba(232,220,200,0.4)', letterSpacing: '0.06em' }}>SALUTE (HP)</div>
                      <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 800, color: '#4ade80' }}>
                        {lvlInfo.effectiveHp}
                        {!lvlInfo.maxLevelReached && (
                          <span style={{ color: '#10b981', fontSize: 12, marginLeft: 4 }}>➔ {lvlInfo.nextEffectiveHp} (+1)</span>
                        )}
                      </div>
                    </div>

                    {/* Mana */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 8.5, color: 'rgba(232,220,200,0.4)', letterSpacing: '0.06em' }}>MANA</div>
                      <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>
                        {selectedVariant.cost ?? 1}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pulsante di Upgrade */}
                {lvlInfo.maxLevelReached ? (
                  <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 8, color: '#f0a500', fontSize: 10, fontFamily: 'Cinzel, serif', fontWeight: 800 }}>
                    👑 QUESTA CARTA HA RAGGIUNTO IL LIVELLO MASSIMO!
                  </div>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={!lvlInfo.canUpgrade}
                    className="font-cinzel"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: lvlInfo.canUpgrade ? '1.5px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                      background: lvlInfo.canUpgrade 
                        ? 'linear-gradient(135deg, #10b981, #059669)' 
                        : 'rgba(255,255,255,0.04)',
                      color: lvlInfo.canUpgrade ? '#ffffff' : 'rgba(232,220,200,0.35)',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      cursor: lvlInfo.canUpgrade ? 'pointer' : 'not-allowed',
                      boxShadow: lvlInfo.canUpgrade ? '0 0 16px rgba(16,185,129,0.5)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {lvlInfo.canUpgrade ? (
                      <>
                        <span>⚡ MIGLIORA A LIVELLO {lvlInfo.level + 1}</span>
                        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 6 }}>
                          Cost: {lvlInfo.upgradeCost} 🪙
                        </span>
                      </>
                    ) : lvlInfo.availableDuplicateCopies < lvlInfo.requiredCopies ? (
                      <span>🔒 Servono altre {lvlInfo.requiredCopies - lvlInfo.availableDuplicateCopies} copie per migliorare</span>
                    ) : (
                      <span>🪙 Monete insufficienti ({gold} / {lvlInfo.upgradeCost} 🪙)</span>
                    )}
                  </button>
                )}

                {levelUpSuccess && (
                  <div style={{ marginTop: 8, textAlign: 'center', color: '#10b981', fontSize: 11, fontFamily: 'Cinzel, serif', fontWeight: 800, animation: 'fadeIn 0.3s ease' }}>
                    ✨ CARTA POTENZIATA CON SUCCESSO AL LIVELLO {lvlInfo.level}!
                  </div>
                )}
              </div>

              {/* Abilità */}
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${(selectedVariant.accentColor || '#f0a500')}22`, borderRadius: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: selectedVariant.accentColor || '#f0a500', fontFamily: 'Cinzel,serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {selectedVariant.abilityTitle || 'Abilità'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.75)', lineHeight: 1.5 }}>
                  {selectedVariant.abilityText || 'Nessuna abilità.'}
                </div>
              </div>

              {/* Lore / Flavor Text */}
              {selectedVariant.flavorText && (
                <div style={{ fontSize: 10.5, color: 'rgba(232,220,200,0.4)', fontStyle: 'italic', marginBottom: 14, lineHeight: 1.4 }}>
                  "{selectedVariant.flavorText}"
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '24px 16px', background: 'rgba(0,0,0,0.4)', border: '1px dashed rgba(240,165,0,0.2)', borderRadius: 12, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
              <div className="font-cinzel" style={{ fontSize: 13, color: '#f0a500', fontWeight: 700, marginBottom: 4 }}>
                Variante {varMeta.label} Non Ancora Trovata
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', lineHeight: 1.5 }}>
                Questa rara versione olografica/speciale non è presente nella tua collezione. Apri più pacchetti per sbloccarla!
              </div>
            </div>
          )}

          <button onClick={onClose} className="font-cinzel" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(232,220,200,0.6)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}

export function RealCollection() {
  const { cards, loaded } = useRealCards()
  const { inventory, hasCard, getCardQuantity } = usePlayerInventory()

  const [search, setSearch] = useState('')
  const [fSet, setFSet] = useState<string>('tutte')
  const [fStatus, setFStatus] = useState<'tutte' | 'scoperte' | 'bloccate'>('tutte')
  const [fRarity, setFRarity] = useState<string>('tutte')
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'rarity'>('number')
  const [selectedGroup, setSelectedGroup] = useState<BaseCardGroup | null>(null)

  // Raggruppa tutte le carte pubblicate per Carta Base
  const baseCardGroups: BaseCardGroup[] = useMemo(() => {
    const groupMap: Record<string, { baseKey: string; baseName: string; variants: any[] }> = {}

    cards.forEach(card => {
      const key = getBaseCardKey(card)
      const baseName = getBaseCardName(card.name)
      if (!groupMap[key]) {
        groupMap[key] = { baseKey: key, baseName, variants: [] }
      }
      groupMap[key].variants.push(card)
    })

    const groups = Object.values(groupMap).map((g, idx) => {
      // Ordina le varianti per livello (standard -> holo -> gold -> full_art -> secret)
      g.variants.sort((a, b) => {
        const vA = VARIANT_ORDER[a.variant || 'standard'] ?? 0
        const vB = VARIANT_ORDER[b.variant || 'standard'] ?? 0
        return vA - vB
      })

      const ownedVariants = g.variants.filter(v => (inventory[v.id] || 0) > 0)
      const isDiscovered = ownedVariants.length > 0
      const totalQuantity = g.variants.reduce((sum, v) => sum + (inventory[v.id] || 0), 0)

      // Mostra la variante migliore trovata, oppure la standard
      const displayCard = ownedVariants[ownedVariants.length - 1] || g.variants[0]

      return {
        baseKey: g.baseKey,
        baseName: g.baseName,
        number: idx + 1,
        variants: g.variants,
        ownedVariants,
        isDiscovered,
        totalQuantity,
        displayCard,
      }
    })

    return groups
  }, [cards, inventory])

  // Filtro e ordinamento
  const filteredGroups = useMemo(() => {
    let list = [...baseCardGroups]

    if (fSet !== 'tutte') {
      list = list.filter(g => g.variants.some(v => v.set === fSet))
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(g => 
        g.baseName.toLowerCase().includes(q) || 
        g.variants.some(v => (v.abilityText || '').toLowerCase().includes(q))
      )
    }

    if (fStatus === 'scoperte') {
      list = list.filter(g => g.isDiscovered)
    } else if (fStatus === 'bloccate') {
      list = list.filter(g => !g.isDiscovered)
    }

    if (fRarity !== 'tutte') {
      list = list.filter(g => g.variants.some(v => v.rarity === fRarity))
    }

    list.sort((a, b) => {
      if (sortBy === 'number') return a.number - b.number
      if (sortBy === 'name') return a.baseName.localeCompare(b.baseName)
      if (sortBy === 'rarity') {
        const rA = RARITY_ORDER[a.displayCard?.rarity] ?? 9
        const rB = RARITY_ORDER[b.displayCard?.rarity] ?? 9
        return rA - rB
      }
      return 0
    })

    return list
  }, [baseCardGroups, search, fSet, fStatus, fRarity, sortBy])

  // Statistiche Album
  const totalBaseCards = baseCardGroups.length
  const discoveredBaseCards = baseCardGroups.filter(g => g.isDiscovered).length
  const totalVariantsCount = cards.length
  const totalVariantsOwned = cards.filter(c => (inventory[c.id] || 0) > 0).length
  const completionPercent = totalVariantsCount > 0 ? Math.round((totalVariantsOwned / totalVariantsCount) * 100) : 0
  const totalCardsOwned = Object.values(inventory).reduce((a, b) => a + b, 0)

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'grid', gridTemplateColumns: '270px 1fr', overflow: 'hidden', background: '#06080f' }}>
      
      {/* Modale Dettaglio & Varianti */}
      {selectedGroup && (
        <DetailModal 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
        />
      )}

      {/* Sidebar Statistiche & Filtri */}
      <div style={{ borderRight: '1px solid rgba(240,165,0,0.08)', overflowY: 'auto', background: 'rgba(6,8,15,0.95)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        
        {/* Box Statistiche di Progresso */}
        <div style={{ padding: '18px 16px', background: 'rgba(13,17,32,0.85)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: 14 }}>
          <div className="font-cinzel" style={{ fontSize: 11, fontWeight: 700, color: '#f0a500', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Collezione Album
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div className="font-cinzel" style={{ fontSize: 26, fontWeight: 800, color: '#e8dcc8' }}>
              {discoveredBaseCards} <span style={{ fontSize: 16, color: 'rgba(232,220,200,0.4)' }}>/ {totalBaseCards}</span>
            </div>
            <div style={{ fontSize: 12, color: '#f0a500', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>
              {completionPercent}%
            </div>
          </div>

          {/* Barra di Progresso */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${completionPercent}%`, height: '100%', background: 'linear-gradient(90deg, #f0a500, #fbbf24)', transition: 'width 0.4s ease' }} />
          </div>

          <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.5)', lineHeight: 1.5 }}>
            • Varianti sbloccate: <strong style={{ color: '#e8dcc8' }}>{totalVariantsOwned}/{totalVariantsCount}</strong><br />
            • Carte totali nel baule: <strong style={{ color: '#e8dcc8' }}>{totalCardsOwned}</strong>
          </div>
        </div>

        {/* Filtro Espansione (Set) */}
        <div>
          <div className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Espansione
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'tutte', label: 'Tutte le Espansioni' },
              { id: 'gli_elettronici', label: 'Gli Elettronici (Base)' },
              { id: 'promo', label: 'Promo / Speciali' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setFSet(s.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'Cinzel, serif',
                  background: fSet === s.id ? 'rgba(240,165,0,0.15)' : 'rgba(13,17,32,0.6)',
                  border: `1px solid ${fSet === s.id ? 'rgba(240,165,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  color: fSet === s.id ? '#f0a500' : 'rgba(232,220,200,0.6)',
                  transition: 'all 0.2s ease',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro Stato Scoperta */}
        <div>
          <div className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Stato Carte
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'tutte', label: 'Tutte le Carte' },
              { id: 'scoperte', label: 'Solo Scoperte' },
              { id: 'bloccate', label: 'Non Trovate (?)' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setFStatus(s.id as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'Cinzel, serif',
                  background: fStatus === s.id ? 'rgba(240,165,0,0.15)' : 'rgba(13,17,32,0.6)',
                  border: `1px solid ${fStatus === s.id ? 'rgba(240,165,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  color: fStatus === s.id ? '#f0a500' : 'rgba(232,220,200,0.6)',
                  transition: 'all 0.2s ease',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro Rarità */}
        <div>
          <div className="font-cinzel" style={{ fontSize: 10, fontWeight: 600, color: 'rgba(232,220,200,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Filtra per Rarità
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setFRarity('tutte')}
              style={{
                padding: '7px 10px',
                borderRadius: 8,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: 'Cinzel, serif',
                background: fRarity === 'tutte' ? 'rgba(240,165,0,0.15)' : 'rgba(13,17,32,0.5)',
                border: `1px solid ${fRarity === 'tutte' ? 'rgba(240,165,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                color: fRarity === 'tutte' ? '#f0a500' : 'rgba(232,220,200,0.5)',
              }}
            >
              Tutte le rarità
            </button>
            {RARITIES.map(r => {
              const meta = rarInfo(r)
              const count = baseCardGroups.filter(g => g.variants.some(v => v.rarity === r)).length
              if (count === 0) return null
              return (
                <div
                  key={r}
                  onClick={() => setFRarity(fRarity === r ? 'tutte' : r)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: fRarity === r ? `${meta.color}18` : 'rgba(13,17,32,0.5)',
                    border: `1px solid ${fRarity === r ? meta.color + '55' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                    <div style={{ fontSize: 10, color: meta.color, fontFamily: 'Cinzel, serif' }}>
                      {meta.label.replace(/^[^A-Za-z]+/, '')}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.5)' }}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Grid Catalogo Album */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Barra di Ricerca & Ordinamento */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(240,165,0,0.08)', background: 'rgba(6,8,15,0.95)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Icon.search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(232,220,200,0.3)', pointerEvents: 'none' }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Cerca carta per nome o abilità..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 8, color: '#e8dcc8', fontSize: 12, outline: 'none' }} 
            />
          </div>
          
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)} 
            style={{ padding: '8px 12px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 8, color: 'rgba(232,220,200,0.7)', fontSize: 11, outline: 'none', cursor: 'pointer' }}
          >
            <option value="number">Ordina: Numero Album</option>
            <option value="name">Ordina: Nome</option>
            <option value="rarity">Ordina: Rarità</option>
          </select>

          <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', whiteSpace: 'nowrap' }}>
            {filteredGroups.length} carte mostrate
          </div>
        </div>

        {/* Griglia Album con Carte e Sagome Nere */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: 20, alignContent: 'flex-start' }}>
          {loaded && baseCardGroups.length === 0 && (
            <div style={{ width: '100%', padding: '60px 20px', textAlign: 'center', color: 'rgba(232,220,200,0.35)', fontSize: 13, lineHeight: 1.7 }}>
              <Icon.cards style={{ width: 36, height: 36, margin: '0 auto 14px', display: 'block', opacity: 0.3 }} />
              Nessuna carta presente nel catalogo. Pubblica le carte dal Creator Studio.
            </div>
          )}

          {filteredGroups.map((group, i) => {
            const displayLvlInfo = group.isDiscovered 
              ? getCardLevelInfo(group.displayCard, inventory) 
              : null
            const displayCardWithStats = group.isDiscovered 
              ? applyCardLevelStats(group.displayCard, displayLvlInfo?.level) 
              : group.displayCard

            return (
              <div 
                key={group.baseKey} 
                style={{ animation: `slide-up 0.4s ease ${Math.min(i, 12) * 0.04}s both`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                {group.isDiscovered ? (
                  <div style={{ position: 'relative' }}>
                    <RealCardTile 
                      card={displayCardWithStats} 
                      level={displayLvlInfo?.level}
                      canUpgrade={displayLvlInfo?.canUpgrade}
                      copiesProgress={!displayLvlInfo?.maxLevelReached ? { current: displayLvlInfo?.availableDuplicateCopies || 0, max: displayLvlInfo?.requiredCopies || 1 } : undefined}
                      onClick={() => {
                        setSelectedGroup(group)
                        soundEngine.playCardFlip()
                      }}
                      badge={`×${group.totalQuantity}`}
                    />
                    
                    {/* Indicatori Varianti sotto la carta */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 18 }}>
                      {group.variants.map(v => {
                        const owned = hasCard(v.id)
                        return (
                          <div 
                            key={v.id}
                            title={v.name}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: owned ? '#f0a500' : 'rgba(255,255,255,0.15)',
                              boxShadow: owned ? '0 0 6px rgba(240,165,0,0.6)' : 'none',
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <LockedCardTile 
                    name={group.baseName} 
                    number={group.number} 
                    onClick={() => {
                      setSelectedGroup(group)
                      soundEngine.playDamage()
                    }} 
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

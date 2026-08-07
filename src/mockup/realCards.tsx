import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { TactileCard } from '../components/card/TactileCard'

export const SERVER_URL = 'http://localhost:4000'

// Rarità delle carte REALI create nello Studio
export const REAL_RARITY: Record<string, { color: string; label: string }> = {
  common:    { color: '#6C8D88', label: '· COMUNE' },
  rare:      { color: '#2563eb', label: '● RARA' },
  epic:      { color: '#9333ea', label: '◆ EPICA' },
  legendary: { color: '#d97706', label: '★ LEGGENDARIA' },
  mythic:    { color: '#e11d48', label: '✦ MITICA' },
}
export const rarInfo = (r: string) => REAL_RARITY[r] || REAL_RARITY.common

// Hook: carica le carte pubblicate con sync live dallo Studio
export function useRealCards() {
  const [cards, setCards] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(SERVER_URL + '/api/cards')
      .then(r => r.json())
      .then(d => { if (alive && Array.isArray(d)) { setCards(d); setLoaded(true) } })
      .catch(() => { if (alive) setLoaded(true) })
    const s = io(SERVER_URL)
    s.on('cards_updated', ({ cards: c }: any) => { if (alive && Array.isArray(c)) setCards(c) })
    return () => { alive = false; s.disconnect() }
  }, [])
  return { cards, loaded }
}

// Tile carta reale per catalogo / collezione (Compatta con stile 1:1 Tactile)
export function RealCardTile({ card, onClick, badge, dimmed, selected }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        opacity: dimmed ? 0.45 : 1,
        transform: selected ? 'scale(1.04)' : 'none',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
      }}
    >
      <TactileCard 
        card={card} 
        size="sm" 
        interactive={!dimmed} 
        className={selected ? 'ring-4 ring-amber-400 rounded-[16px] shadow-glow-amber' : ''}
      />
      {badge !== undefined && badge !== null && (
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: '#f0a500',
          color: '#06080f',
          borderRadius: 12,
          padding: '2px 8px',
          fontSize: 10,
          fontWeight: 800,
          fontFamily: 'Cinzel, serif',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          zIndex: 30,
          pointerEvents: 'none'
        }}>
          {badge}
        </div>
      )}
    </div>
  )
}

// Carta reale grande per modale e dettaglio
export function RealBigCard({ card }: any) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <TactileCard card={card} size="lg" interactive={true} />
    </div>
  )
}

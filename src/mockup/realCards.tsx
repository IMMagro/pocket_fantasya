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

// Utility per rimuovere il suffisso della variante dal nome della carta
export function cleanCardName(name?: string): string {
  if (!name) return ''
  return name.split(/\s*·\s*/)[0].trim()
}

// Hook: carica le carte pubblicate con sync live dallo Studio
export function useRealCards() {
  const [cards, setCards] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    fetch(SERVER_URL + '/api/cards')
      .then(r => r.json())
      .then(d => { 
        if (alive && Array.isArray(d)) { 
          const cleanList = d.map(c => ({ ...c, name: cleanCardName(c.name) }))
          setCards(cleanList)
          setLoaded(true) 
        } 
      })
      .catch(() => { if (alive) setLoaded(true) })
    const s = io(SERVER_URL)
    s.on('cards_updated', ({ cards: c }: any) => { 
      if (alive && Array.isArray(c)) {
        const cleanList = c.map((card: any) => ({ ...card, name: cleanCardName(card.name) }))
        setCards(cleanList)
      } 
    })
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

// Carta Silhouette Nera con Punto Interrogativo per carte/varianti non ancora scoperte
export function LockedCardTile({ onClick, name, number, size = 'sm' }: { onClick?: () => void; name?: string; number?: number | string; size?: 'sm' | 'lg' }) {
  const isSm = size === 'sm';
  const width = isSm ? 170 : 280;
  const height = isSm ? 245 : 400;

  return (
    <div 
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        width,
        height,
        borderRadius: 16,
        background: 'linear-gradient(145deg, #070913 0%, #0d1120 50%, #05070d 100%)',
        border: '1.5px dashed rgba(240, 165, 0, 0.25)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.8)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240, 165, 0, 0.6)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.8), 0 0 15px rgba(240,165,0,0.15)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240, 165, 0, 0.25)';
          (e.currentTarget as HTMLElement).style.transform = 'none';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.8)';
        }
      }}
    >
      {/* Pattern di sfondo a circuiti/griglia scura */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.12,
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(240,165,0,0.4) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        pointerEvents: 'none'
      }} />

      {/* Numero della carta in alto a sinistra */}
      {number !== undefined && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 12,
          fontSize: isSm ? 10 : 12,
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          color: 'rgba(232, 220, 200, 0.3)',
          letterSpacing: '0.08em'
        }}>
          #{String(number).padStart(2, '0')}
        </div>
      )}

      {/* Badge Lucchetto in alto a destra */}
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(240,165,0,0.2)',
        borderRadius: 8,
        padding: '3px 6px',
        fontSize: isSm ? 9 : 10,
        color: 'rgba(240,165,0,0.6)',
        fontFamily: 'Cinzel, serif',
        fontWeight: 700
      }}>
        🔒 BLOCCATA
      </div>

      {/* Centro: Grande Punto Interrogativo con Bagliore */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isSm ? 8 : 14,
        padding: '0 16px'
      }}>
        <div style={{
          width: isSm ? 58 : 90,
          height: isSm ? 58 : 90,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(240, 165, 0, 0.15) 0%, rgba(0,0,0,0.4) 80%)',
          border: '1px solid rgba(240, 165, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0,0,0,0.6), inset 0 0 10px rgba(240,165,0,0.1)'
        }}>
          <span style={{
            fontSize: isSm ? 32 : 52,
            fontWeight: 900,
            fontFamily: 'Cinzel, serif',
            color: 'rgba(240, 165, 0, 0.65)',
            textShadow: '0 0 15px rgba(240, 165, 0, 0.4)'
          }}>
            ?
          </span>
        </div>

        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isSm ? (name && name.length > 20 ? 9 : name && name.length > 14 ? 10 : 11) : 14,
            fontWeight: 700,
            fontFamily: 'Cinzel, serif',
            color: 'rgba(232, 220, 200, 0.5)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1.15,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0 8px'
          }}>
            {name || 'Carta Misteriosa'}
          </div>
          <div style={{
            fontSize: isSm ? 9 : 11,
            color: 'rgba(232, 220, 200, 0.25)',
            marginTop: 2
          }}>
            Trovala nei pacchetti
          </div>
        </div>
      </div>

      {/* Cornice decorativa interna */}
      <div style={{
        position: 'absolute',
        inset: 6,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.03)',
        pointerEvents: 'none'
      }} />
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


import React, { useState, useEffect } from 'react';
import { TactileCard } from './TactileCard';

export function GlobalCardViewerModal() {
  const [viewCard, setViewCard] = useState(null);

  useEffect(() => {
    const handleInspect = (e) => {
      if (e.detail && e.detail.card) {
        setViewCard(e.detail.card);
      }
    };
    window.addEventListener('inspect-card', handleInspect);
    return () => window.removeEventListener('inspect-card', handleInspect);
  }, []);

  if (!viewCard) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={(e) => { e.stopPropagation(); setViewCard(null); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setViewCard(null); }}
    >
      <div 
        className="relative pointer-events-auto transform scale-125 md:scale-150 transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <TactileCard card={viewCard} size="lg" interactive={true} />
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-sm font-serif pointer-events-none tracking-widest uppercase font-bold bg-black/50 px-4 py-2 rounded-full">
        Clicca fuori per chiudere
      </div>
    </div>
  );
}

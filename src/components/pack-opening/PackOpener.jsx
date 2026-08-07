import React, { useState } from 'react';
import { TactileCard } from '../card/TactileCard';
import { Sparkles, Package, RotateCcw, CheckCircle2, Trophy } from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';
import confetti from 'canvas-confetti';

export function PackOpener({ availableCards, onAddCardsToCollection }) {
  const [packState, setPackState] = useState('sealed'); // 'sealed', 'opening', 'revealing', 'done'
  const [pulledCards, setPulledCards] = useState([]);
  const [revealedIndices, setRevealedIndices] = useState(new Set());

  // Generate a randomized 5-card booster pack with rarity weights
  const generatePack = () => {
    if (!availableCards || availableCards.length === 0) return [];
    
    const commons = availableCards.filter(c => c.rarity === 'common');
    const rares = availableCards.filter(c => c.rarity === 'rare');
    const epics = availableCards.filter(c => c.rarity === 'epic');
    const legendaries = availableCards.filter(c => c.rarity === 'legendary' || c.rarity === 'mythic');

    const pack = [];
    
    // Slot 1-3: Commons (or fallback)
    for (let i = 0; i < 3; i++) {
      const pool = commons.length > 0 ? commons : availableCards;
      pack.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // Slot 4: Rare or higher
    const rarePool = rares.length > 0 ? rares : availableCards;
    pack.push(rarePool[Math.floor(Math.random() * rarePool.length)]);

    // Slot 5: Lucky wildcard (50% Rare, 35% Epic, 15% Legendary/Mythic)
    const roll = Math.random();
    if (roll < 0.15 && legendaries.length > 0) {
      pack.push(legendaries[Math.floor(Math.random() * legendaries.length)]);
    } else if (roll < 0.50 && epics.length > 0) {
      pack.push(epics[Math.floor(Math.random() * epics.length)]);
    } else if (rares.length > 0) {
      pack.push(rares[Math.floor(Math.random() * rares.length)]);
    } else {
      pack.push(availableCards[Math.floor(Math.random() * availableCards.length)]);
    }

    return pack;
  };

  const handleOpenPack = () => {
    soundEngine.playPackTear();
    setPackState('opening');
    const newCards = generatePack();
    setPulledCards(newCards);
    setRevealedIndices(new Set());

    setTimeout(() => {
      setPackState('revealing');
    }, 900);
  };

  const handleRevealCard = (index) => {
    if (revealedIndices.has(index)) return;
    
    soundEngine.playCardFlip();
    const updated = new Set(revealedIndices);
    updated.add(index);
    setRevealedIndices(updated);

    const card = pulledCards[index];
    if (card && (card.rarity === 'legendary' || card.rarity === 'mythic' || card.rarity === 'epic')) {
      soundEngine.playLegendaryFanfare();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    if (updated.size === pulledCards.length) {
      setTimeout(() => {
        setPackState('done');
        onAddCardsToCollection(pulledCards);
      }, 700);
    }
  };

  const handleRevealAll = () => {
    const all = new Set([0, 1, 2, 3, 4]);
    setRevealedIndices(all);
    soundEngine.playLegendaryFanfare();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setPackState('done');
    onAddCardsToCollection(pulledCards);
  };

  const handleReset = () => {
    soundEngine.playButtonClick();
    setPackState('sealed');
    setPulledCards([]);
    setRevealedIndices(new Set());
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col items-center justify-center min-h-[720px]">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-100 flex items-center justify-center gap-3">
          <Package className="w-8 h-8 text-amber-400" />
          Sbustamento Pacchetti 3D
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Apri i tuoi booster pack personalizzati e trova le carte create nello Studio!
        </p>
      </div>

      {/* STATE 1: SEALED BOOSTER PACK */}
      {packState === 'sealed' && (
        <div className="flex flex-col items-center">
          {/* 3D Booster Pack Graphic */}
          <div 
            onClick={handleOpenPack}
            className="group relative w-[240px] h-[360px] rounded-2xl bg-gradient-to-br from-amber-600 via-stone-800 to-slate-900 p-1 cursor-pointer transition-transform duration-300 hover:scale-105 hover:-rotate-1 shadow-2xl shadow-amber-500/20 border-2 border-amber-400/60 flex flex-col justify-between overflow-hidden"
          >
            {/* Holographic metallic foil shine on pack */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* Top Seal Perforation */}
            <div className="border-b-2 border-dashed border-amber-300/80 pb-2 text-center text-[10px] font-mono tracking-widest text-amber-200">
              ✂ STRAPPA QUI PER APRIRE
            </div>

            {/* Pack Brand Center */}
            <div className="text-center my-auto p-4 bg-black/40 backdrop-blur-sm rounded-xl border border-amber-400/30">
              <div className="text-2xl font-black font-serif tracking-wider text-amber-300 drop-shadow">
                CARD CLASH
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300 mt-1">
                Custom Edition Set
              </div>
              <div className="mt-3 inline-block px-3 py-1 bg-amber-500 text-black font-bold text-xs rounded-full">
                5 CARTE TATTILI
              </div>
            </div>

            {/* Bottom Seal */}
            <div className="text-center text-[10px] font-sans text-slate-400 pt-2 border-t border-amber-400/30">
              ★ Contiene carte Rare o Leggendarie ★
            </div>
          </div>

          <button
            onClick={handleOpenPack}
            className="mt-8 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-base rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> Strappa e Apri il Pacchetto!
          </button>
        </div>
      )}

      {/* STATE 2: TEARING PACK ANIMATION */}
      {packState === 'opening' && (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="w-[240px] h-[360px] rounded-2xl bg-amber-500/20 border-4 border-amber-400 animate-ping flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-amber-400 animate-spin" />
          </div>
          <div className="mt-6 text-xl font-serif font-bold text-amber-300 animate-pulse">
            Strappando la bustina...
          </div>
        </div>
      )}

      {/* STATE 3 & 4: REVEALING & DONE */}
      {(packState === 'revealing' || packState === 'done') && (
        <div className="w-full flex flex-col items-center">
          
          <div className="flex items-center justify-between w-full max-w-5xl mb-6">
            <div className="text-sm font-semibold text-slate-300">
              Rivelate: <span className="text-amber-400 font-bold">{revealedIndices.size} / 5</span>
            </div>
            {packState === 'revealing' && (
              <button
                onClick={handleRevealAll}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
              >
                Rivela Tutte Subito
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 justify-center items-center">
            {pulledCards.map((card, idx) => {
              const isRevealed = revealedIndices.has(idx);
              return (
                <div 
                  key={idx}
                  onClick={() => handleRevealCard(idx)}
                  className="flex flex-col items-center cursor-pointer"
                >
                  {isRevealed ? (
                    <div className="animate-fade-in transform hover:-translate-y-2 transition-transform">
                      <TactileCard 
                        card={card}
                        size="md"
                        interactive={true}
                      />
                    </div>
                  ) : (
                    /* Card Back (Covered) */
                    <div className="w-[210px] h-[305px] rounded-[18px] bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-xl flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform group">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                      </div>
                      <div className="mt-4 font-serif font-bold text-amber-200 text-sm tracking-wider">
                        CLICCA PER RIVELARE
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        CARTA #{idx + 1}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary / Open Another */}
          {packState === 'done' && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                5 Carte aggiunte al tuo Album Collezione!
              </div>

              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Apri un Altro Pacchetto
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

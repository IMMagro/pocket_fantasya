import React, { useState } from 'react';
import { TactileCard, CARD_VARIANTS } from '../card/TactileCard';
import { Sparkles, Package, RotateCcw, CheckCircle2, Trophy, HelpCircle, Palette, Crown } from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';
import confetti from 'canvas-confetti';

// Variant Finish Roll calculation based on rarity and chance
export function rollCardFinishVariant(baseCard) {
  if (!baseCard) return null;
  const rarity = baseCard.rarity || 'common';
  const roll = Math.random();

  let variant = 'standard';
  if (rarity === 'mythic') {
    if (roll < 0.20) variant = 'secret_holo';
    else if (roll < 0.45) variant = 'full_art';
    else if (roll < 0.75) variant = 'gold_foil';
    else if (roll < 0.95) variant = 'holo';
    else variant = 'standard';
  } else if (rarity === 'legendary') {
    if (roll < 0.08) variant = 'secret_holo';
    else if (roll < 0.28) variant = 'full_art';
    else if (roll < 0.58) variant = 'gold_foil';
    else if (roll < 0.88) variant = 'holo';
    else variant = 'standard';
  } else if (rarity === 'epic') {
    if (roll < 0.03) variant = 'secret_holo';
    else if (roll < 0.13) variant = 'full_art';
    else if (roll < 0.33) variant = 'gold_foil';
    else if (roll < 0.78) variant = 'holo';
    else variant = 'standard';
  } else if (rarity === 'rare') {
    if (roll < 0.01) variant = 'secret_holo';
    else if (roll < 0.06) variant = 'full_art';
    else if (roll < 0.16) variant = 'gold_foil';
    else if (roll < 0.46) variant = 'holo';
    else variant = 'standard';
  } else {
    // Common
    if (roll < 0.002) variant = 'secret_holo';
    else if (roll < 0.017) variant = 'full_art';
    else if (roll < 0.052) variant = 'gold_foil';
    else if (roll < 0.202) variant = 'holo';
    else variant = 'standard';
  }

  // If base card already had full_art set in creator, keep it or upgrade to secret_holo
  if (baseCard.variant === 'full_art' && variant === 'standard') {
    variant = 'full_art';
  } else if (baseCard.variant && variant === 'standard') {
    variant = baseCard.variant;
  }

  return {
    ...baseCard,
    variant,
    isFullArt: variant === 'full_art' || variant === 'secret_holo'
  };
}

export function PackOpener({ availableCards, onAddCardsToCollection }) {
  const [packState, setPackState] = useState('sealed'); // 'sealed', 'opening', 'revealing', 'done'
  const [pulledCards, setPulledCards] = useState([]);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [showRatesModal, setShowRatesModal] = useState(false);

  // Generate a randomized 5-card booster pack with rarity weights and finish variant rolls
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
      const base = pool[Math.floor(Math.random() * pool.length)];
      pack.push(rollCardFinishVariant(base));
    }

    // Slot 4: Rare or higher guaranteed
    const rarePool = (rares.length > 0 || epics.length > 0 || legendaries.length > 0)
      ? [...rares, ...epics, ...legendaries]
      : availableCards;
    const baseRare = rarePool[Math.floor(Math.random() * rarePool.length)];
    pack.push(rollCardFinishVariant(baseRare));

    // Slot 5: Lucky wildcard (Rare / Epic / Legendary / Mythic)
    const roll = Math.random();
    let baseWild;
    if (roll < 0.15 && legendaries.length > 0) {
      baseWild = legendaries[Math.floor(Math.random() * legendaries.length)];
    } else if (roll < 0.50 && epics.length > 0) {
      baseWild = epics[Math.floor(Math.random() * epics.length)];
    } else if (rares.length > 0) {
      baseWild = rares[Math.floor(Math.random() * rares.length)];
    } else {
      baseWild = availableCards[Math.floor(Math.random() * availableCards.length)];
    }
    pack.push(rollCardFinishVariant(baseWild));

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
    const isSpecialVariant = card && (card.variant === 'full_art' || card.variant === 'secret_holo' || card.variant === 'gold_foil' || card.variant === 'holo');
    const isHighRarity = card && (card.rarity === 'legendary' || card.rarity === 'mythic' || card.rarity === 'epic');

    if (isSpecialVariant || isHighRarity) {
      soundEngine.playLegendaryFanfare();
      confetti({
        particleCount: isSpecialVariant ? 90 : 60,
        spread: 65,
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
      particleCount: 120,
      spread: 75,
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
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-100 flex items-center justify-center gap-3">
          <Package className="w-8 h-8 text-amber-400" />
          Sbustamento Pacchetti 3D
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Apri i booster pack e trova versioni <strong>Full-Art</strong>, <strong>Olografiche</strong>, <strong>Gold Foil</strong> e <strong>Secret Rare</strong>!
        </p>

        {/* Drop Rates Button */}
        <button
          onClick={() => setShowRatesModal(true)}
          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Percentuali di Drop & Varianti
        </button>
      </div>

      {/* Rates Modal */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131922] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Percentuali di Drop nei Pacchetti
              </h3>
              <button 
                onClick={() => setShowRatesModal(false)}
                className="text-slate-400 hover:text-slate-100 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 uppercase tracking-wider block">
                  ✨ Distribuzione Slot Pacchetto (5 Carte):
                </span>
                <p>• <strong>Slot 1, 2, 3:</strong> Carte Comuni (con possibilità di finiture speciali)</p>
                <p>• <strong>Slot 4:</strong> Rara, Epica o Leggendaria Garantita</p>
                <p>• <strong>Slot 5:</strong> Slot Fortunato Wildcard (50% Rara, 35% Epica, 15% Leggendaria/Mitica)</p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                  🎨 Probabilità Varianti & Finiture (Scala con Rarità):
                </span>
                <p>• <strong>👑 Secret Rare (Gold + Holo Full-Art):</strong> 0.2% - 20% (Max su Mitiche)</p>
                <p>• <strong>🎨 Full-Art a Tutto Schermo:</strong> 1.5% - 25%</p>
                <p>• <strong>🌟 Gold Foil Laminata in Oro:</strong> 3.5% - 30%</p>
                <p>• <strong>✨ Olografica (Holo Arcobaleno):</strong> 15% - 45%</p>
                <p>• <strong>📜 Classica Pergamena Tattile:</strong> Restante quota</p>
              </div>
            </div>

            <button
              onClick={() => setShowRatesModal(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

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
                POCKET FANTASYA
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-300 mt-1">
                Booster Pack Speciale
              </div>
              <div className="mt-3 inline-block px-3 py-1 bg-amber-500 text-black font-bold text-xs rounded-full">
                5 CARTE TATTILI
              </div>
            </div>

            {/* Bottom Seal */}
            <div className="text-center text-[10px] font-sans text-slate-400 pt-2 border-t border-amber-400/30">
              ★ Possibilità Full-Art, Holo & Gold Foil ★
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
                    <div className="w-[230px] h-[330px] rounded-[18px] bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-xl flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform group">
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
                5 Carte (incluse varianti speciali) aggiunte alla tua Collezione!
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

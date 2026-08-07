import React, { useState } from 'react';
import { TactileCard } from '../card/TactileCard';
import { Layers, Plus, Trash2, Check, AlertCircle, BarChart2, Shield, Swords, Sparkles } from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';

export function DeckBuilder({ allCards, decks, activeDeckId, onSaveDecks, onSetActiveDeck }) {
  const [currentDeckId, setCurrentDeckId] = useState(activeDeckId || decks[0]?.id || 'default_deck');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');

  const currentDeck = decks.find(d => d.id === currentDeckId) || decks[0] || {
    id: 'deck_1',
    name: 'Mazzo Iniziale',
    cardIds: allCards.slice(0, 15).map(c => c.id)
  };

  const currentDeckCards = (currentDeck.cardIds || [])
    .map(id => allCards.find(c => c.id === id))
    .filter(Boolean);

  // Group cards for the deck sidebar
  const deckCardCounts = {};
  currentDeckCards.forEach(c => {
    deckCardCounts[c.id] = (deckCardCounts[c.id] || 0) + 1;
  });

  const uniqueDeckCards = Array.from(new Set(currentDeckCards.map(c => c.id)))
    .map(id => allCards.find(c => c.id === id))
    .filter(Boolean)
    .sort((a, b) => a.cost - b.cost);

  // Mana Curve calculation
  const manaCurve = [0, 0, 0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5, 6, 7+
  currentDeckCards.forEach(c => {
    const idx = Math.min(Math.max((c.cost || 1) - 1, 0), 6);
    manaCurve[idx]++;
  });
  const maxManaCount = Math.max(...manaCurve, 1);

  // Add Card to Current Deck
  const handleAddCard = (card) => {
    const count = deckCardCounts[card.id] || 0;
    const maxAllowed = (card.rarity === 'legendary' || card.rarity === 'mythic') ? 1 : 2;

    if (count >= maxAllowed) {
      soundEngine.playDamage();
      return;
    }

    if (currentDeckCards.length >= 30) {
      soundEngine.playDamage();
      return;
    }

    soundEngine.playCardPlay();
    const updatedCardIds = [...currentDeck.cardIds, card.id];
    const updatedDecks = decks.map(d => d.id === currentDeck.id ? { ...d, cardIds: updatedCardIds } : d);
    onSaveDecks(updatedDecks);
  };

  // Remove Card from Current Deck
  const handleRemoveCard = (cardId) => {
    soundEngine.playButtonClick();
    const idx = currentDeck.cardIds.lastIndexOf(cardId);
    if (idx !== -1) {
      const updatedCardIds = [...currentDeck.cardIds];
      updatedCardIds.splice(idx, 1);
      const updatedDecks = decks.map(d => d.id === currentDeck.id ? { ...d, cardIds: updatedCardIds } : d);
      onSaveDecks(updatedDecks);
    }
  };

  // Create New Deck
  const handleCreateNewDeck = () => {
    soundEngine.playButtonClick();
    const newDeck = {
      id: `deck_${Date.now()}`,
      name: `Nuovo Mazzo ${decks.length + 1}`,
      cardIds: allCards.slice(0, 10).map(c => c.id)
    };
    const updatedDecks = [...decks, newDeck];
    onSaveDecks(updatedDecks);
    setCurrentDeckId(newDeck.id);
  };

  // Set as Active Battle Deck
  const handleSetBattleDeck = () => {
    soundEngine.playLegendaryFanfare();
    onSetActiveDeck(currentDeck.id);
  };

  // Filter available cards
  const filteredAvailableCards = allCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  });

  const isCurrentActive = activeDeckId === currentDeck.id;
  const isDeckValid = currentDeckCards.length >= 10 && currentDeckCards.length <= 30;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold font-serif flex items-center gap-3 text-slate-100">
            <Layers className="w-8 h-8 text-amber-400" />
            Deck Builder (Costruttore di Mazzi)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Componi il tuo mazzo da combattimento (da 10 a 30 carte) per le partite contro il collega o l'AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNewDeck}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition border border-slate-700"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Nuovo Mazzo
          </button>

          <button
            onClick={handleSetBattleDeck}
            disabled={isCurrentActive || !isDeckValid}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg ${
              isCurrentActive 
                ? 'bg-emerald-600 text-white cursor-default' 
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            {isCurrentActive ? (
              <><Check className="w-4 h-4" /> Mazzo Attivo per la Battaglia</>
            ) : (
              <><Swords className="w-4 h-4" /> Imposta come Mazzo Attivo</>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Cards Pool Catalog (8 cols) */}
        <div className="lg:col-span-8 bg-[#131922] border border-slate-800 rounded-xl p-4">
          
          {/* Search & Rarity Filter */}
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <input
              type="text"
              placeholder="Cerca carte nel catalogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 w-full max-w-xs focus:outline-none focus:border-amber-400"
            />

            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">Tutte le Rarità</option>
              <option value="common">Comuni</option>
              <option value="rare">Rare</option>
              <option value="epic">Epiche</option>
              <option value="legendary">Leggendarie</option>
              <option value="mythic">Mitiche</option>
            </select>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[700px] overflow-y-auto p-1">
            {filteredAvailableCards.map(card => {
              const inDeckCount = deckCardCounts[card.id] || 0;
              const maxCopies = (card.rarity === 'legendary' || card.rarity === 'mythic') ? 1 : 2;
              const isMaxed = inDeckCount >= maxCopies;

              return (
                <div 
                  key={card.id}
                  onClick={() => handleAddCard(card)}
                  className={`relative flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1 ${
                    isMaxed ? 'opacity-50' : ''
                  }`}
                >
                  {inDeckCount > 0 && (
                    <div className="absolute top-1 right-2 z-10 bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs font-black shadow">
                      Nel Mazzo: {inDeckCount}/{maxCopies}
                    </div>
                  )}

                  <TactileCard 
                    card={card}
                    size="sm"
                    interactive={false}
                  />
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Side: Active Deck Inspector & Mana Curve (4 cols) */}
        <div className="lg:col-span-4 bg-[#131922] border border-slate-800 rounded-xl p-4 space-y-4">
          
          {/* Deck Selector & Name Edit */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Mazzo Selezionato
            </label>
            <div className="flex gap-2">
              <select
                value={currentDeckId}
                onChange={(e) => setCurrentDeckId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none font-semibold"
              >
                {decks.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.cardIds?.length || 0} carte) {activeDeckId === d.id ? '★ [ATTIVO]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deck Stats & Mana Curve */}
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
              <span>Curva del Mana</span>
              <span className={`font-mono ${currentDeckCards.length < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentDeckCards.length} / 30 Carte
              </span>
            </div>

            {/* Mana Bar Histogram */}
            <div className="flex items-end justify-between gap-1.5 h-16 pt-2 px-1">
              {manaCurve.map((count, i) => {
                const heightPercent = maxManaCount > 0 ? (count / maxManaCount) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] font-mono text-slate-400 mb-0.5">{count > 0 ? count : ''}</span>
                    <div 
                      className="w-full bg-amber-500 hover:bg-amber-400 rounded-t transition-all duration-300 min-h-[2px]"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 mt-1">{i === 6 ? '7+' : i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Deck Cards List */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Carte nel Mazzo ({uniqueDeckCards.length} uniche)
            </div>

            {uniqueDeckCards.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Clicca sulle carte a sinistra per aggiungerle al mazzo!
              </div>
            ) : (
              uniqueDeckCards.map(card => {
                const count = deckCardCounts[card.id];
                return (
                  <div
                    key={card.id}
                    onClick={() => handleRemoveCard(card.id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold font-mono px-1.5 py-0.5 bg-[#242e38] text-white rounded">
                        {card.cost}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-rose-300">
                        {card.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                        x{count}
                      </span>
                      <Trash2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

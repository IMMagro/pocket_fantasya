import React, { useState } from 'react';
import { TactileCard } from '../card/TactileCard';
import { BookOpen, Search, Filter, Sparkles, Layers } from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';

export function CollectionAlbum({ collection = {}, allCards = [] }) {
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  // Filter cards based on user search and dropdowns
  const filteredCards = allCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (card.abilityText && card.abilityText.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
    const matchesType = filterType === 'all' || card.type === filterType;
    return matchesSearch && matchesRarity && matchesType;
  });

  const totalDistinctUnlocked = allCards.filter(c => (collection[c.id] || 0) > 0).length;
  const completionRate = allCards.length > 0 ? Math.round((totalDistinctUnlocked / allCards.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      
      {/* Header & Stats Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold font-serif flex items-center gap-3 text-slate-100">
            <BookOpen className="w-8 h-8 text-amber-400" />
            Album Collezione (Card Binder)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visualizza tutte le carte sbloccate sbustando i pacchetti.
          </p>
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-[#131922] border border-slate-800 px-4 py-3 rounded-xl min-w-[240px]">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1.5">
            <span>Completamento Collezione</span>
            <span className="text-amber-400">{completionRate}% ({totalDistinctUnlocked}/{allCards.length})</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#131922] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome o effetto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-200 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterRarity}
            onChange={(e) => { setFilterRarity(e.target.value); soundEngine.playButtonClick(); }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Tutte le Rarità</option>
            <option value="common">Comuni</option>
            <option value="rare">Rare</option>
            <option value="epic">Epiche</option>
            <option value="legendary">Leggendarie</option>
            <option value="mythic">Mitiche</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); soundEngine.playButtonClick(); }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Tutti i Tipi</option>
            <option value="CREATURA">Creature</option>
            <option value="MAGIA">Magie</option>
            <option value="ARTEFATTO">Artefatti</option>
            <option value="TRAPPOLA">Trappole</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredCards.map(card => {
          const ownedCount = collection[card.id] || 0;
          const isUnlocked = ownedCount > 0;

          return (
            <div 
              key={card.id}
              onClick={() => { setSelectedCard(card); soundEngine.playCardFlip(); }}
              className="relative flex flex-col items-center group cursor-pointer"
            >
              {/* Owned Badge */}
              {isUnlocked && (
                <div className="absolute top-1 right-2 z-10 bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs font-black shadow-lg">
                  x{ownedCount}
                </div>
              )}

              {/* Card Container */}
              <div className={`transition-all duration-300 transform group-hover:-translate-y-2 ${!isUnlocked ? 'filter grayscale brightness-50 opacity-60' : ''}`}>
                <TactileCard 
                  card={card}
                  size="md"
                  interactive={isUnlocked}
                />
              </div>

              {!isUnlocked && (
                <div className="mt-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  🔒 Da Sbustare
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Size Modal Preview */}
      {selectedCard && (
        <div 
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex flex-col items-center"
          >
            <TactileCard 
              card={selectedCard}
              size="xl"
              interactive={true}
            />
            <button
              onClick={() => setSelectedCard(null)}
              className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition"
            >
              Chiudi Anteprima
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

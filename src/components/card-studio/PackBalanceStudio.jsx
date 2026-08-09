import React, { useState, useMemo, useEffect } from 'react';
import { Save, Search, Settings2, Sparkles, PackageOpen, Info, Zap, BarChart3, X } from 'lucide-react';
import { RealCardTile, RealBigCard } from '../../mockup/realCards';

const RARITY_WEIGHT = { common: 68, rare: 22, epic: 7, legendary: 2.4, mythic: 0.6 };
const RARITY_COLORS = {
  common: 'text-slate-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
  mythic: 'text-rose-500'
};

export function PackBalanceStudio({ cards, onSaveMultipleCards }) {
  const [filterRarity, setFilterRarity] = useState('all');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState(null); // per il modal
  
  const [localCards, setLocalCards] = useState([...cards]);

  // Aggrega le carte per nome base
  const groupedCards = useMemo(() => {
    const groups = {};
    for (const card of localCards) {
      const baseName = card.name.split('·')[0].trim();
      if (!groups[baseName]) {
        groups[baseName] = {
          baseName,
          rarity: card.rarity,
          image: card.image,
          variants: [],
          totalWeight: 0,
          displayCard: card // Usa la prima come copertina
        };
      }
      let currentWeight = card.dropWeight;
      if (typeof currentWeight !== 'number') {
        currentWeight = RARITY_WEIGHT[card.rarity] || 1;
      }
      
      groups[baseName].variants.push({ ...card, dropWeight: currentWeight });
      groups[baseName].totalWeight += currentWeight;
    }
    return Object.values(groups).sort((a, b) => a.baseName.localeCompare(b.baseName));
  }, [localCards]);

  // Peso totale dell'espansione
  const grandTotalWeight = useMemo(() => {
    return localCards.reduce((acc, card) => {
      const w = typeof card.dropWeight === 'number' ? card.dropWeight : (RARITY_WEIGHT[card.rarity] || 1);
      return acc + w;
    }, 0);
  }, [localCards]);

  // Calcolo probabilità GLOBALE per Rarità (almeno 1 carta di questa rarità in 1 bustina da 5)
  const rarityStats = useMemo(() => {
    const stats = { mythic: 0, legendary: 0, epic: 0, rare: 0, common: 0 };
    localCards.forEach(c => {
      const w = typeof c.dropWeight === 'number' ? c.dropWeight : (RARITY_WEIGHT[c.rarity] || 1);
      if (stats[c.rarity] !== undefined) stats[c.rarity] += w;
    });

    const result = {};
    for (const r in stats) {
      if (stats[r] > 0) {
        const baseChance = stats[r] / grandTotalWeight;
        const packChance = (1 - Math.pow(1 - baseChance, 5)) * 100;
        result[r] = packChance;
      }
    }
    return result;
  }, [localCards, grandTotalWeight]);

  // Calcolo probabilità GLOBALE per Variante (almeno 1 carta di questa variante in 1 bustina)
  const variantStats = useMemo(() => {
    const stats = {};
    localCards.forEach(c => {
      const w = typeof c.dropWeight === 'number' ? c.dropWeight : (RARITY_WEIGHT[c.rarity] || 1);
      const v = c.variant || 'standard';
      if (!stats[v]) stats[v] = 0;
      stats[v] += w;
    });

    const result = {};
    for (const v in stats) {
      if (stats[v] > 0) { // Do not ignore standard cards
        const baseChance = stats[v] / grandTotalWeight;
        const packChance = (1 - Math.pow(1 - baseChance, 5)) * 100;
        result[v] = packChance;
      }
    }
    return result;
  }, [localCards, grandTotalWeight]);

  // Aggiornamento del singolo peso
  const handleUpdateWeight = (cardId, newWeight) => {
    setLocalCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, dropWeight: Math.max(0, parseFloat(newWeight) || 0) } : c
    ));
    
    // Aggiorna anche il modal live se aperto
    setActiveGroup(prev => {
      if (!prev) return prev;
      const updatedVariants = prev.variants.map(v => 
        v.id === cardId ? { ...v, dropWeight: Math.max(0, parseFloat(newWeight) || 0) } : v
      );
      const newTotal = updatedVariants.reduce((s, v) => s + v.dropWeight, 0);
      return { ...prev, variants: updatedVariants, totalWeight: newTotal };
    });
  };

  // PRESET DI MASSA
  const applyPreset = (type) => {
    const VARIANT_MULTIPLIER = {
      standard: 1,
      holo: 0.2,
      gold_foil: 0.08,
      full_art: 0.03,
      secret_holo: 0.01,
      out: 0.002
    };

    setLocalCards(prev => prev.map(c => {
      let baseW = RARITY_WEIGHT[c.rarity] || 1;
      const v = c.variant || 'standard';
      let vMult = VARIANT_MULTIPLIER[v] || 1;
      let newW = baseW * vMult;
      
      if (type === 'standard') {
        // newW remains as calculated
      } else if (type === 'generous') {
        if (c.rarity === 'mythic') newW = baseW * 3 * vMult;
        else if (c.rarity === 'legendary') newW = baseW * 2 * vMult;
        else if (c.rarity === 'epic') newW = baseW * 1.5 * vMult;
        else newW = baseW * 0.9 * vMult;
      } else if (type === 'hardcore') {
        if (c.rarity === 'mythic') newW = baseW * 0.3 * vMult;
        else if (c.rarity === 'legendary') newW = baseW * 0.5 * vMult;
        else if (c.rarity === 'epic') newW = baseW * 0.8 * vMult;
      }
      return { ...c, dropWeight: newW };
    }));
  };

  const handleSave = () => {
    if (onSaveMultipleCards) {
      onSaveMultipleCards(localCards);
    }
  };

  const filteredGroups = groupedCards.filter(g => {
    if (filterRarity !== 'all' && g.rarity !== filterRarity) return false;
    if (search && !g.baseName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Listener escape per modal
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setActiveGroup(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="flex gap-4 h-full p-4 text-slate-100 font-sans relative">
      {/* Left Sidebar */}
      <div className="w-[340px] flex flex-col gap-4 overflow-y-auto pr-2">
        
        {/* Info Box */}
        <div className="bg-emerald-950/40 border border-emerald-900/50 p-4 rounded-2xl shadow-lg shrink-0">
          <h2 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Come funziona?
          </h2>
          <p className="text-xs text-emerald-100/70 leading-relaxed">
            Clicca su una carta per aprire il <b>Pannello Varianti</b>. Regolane la Frequenza e il sistema calcolerà la <b>probabilità esatta</b> di trovarla in <b>1 singola bustina</b> (5 carte).
          </p>
        </div>

        {/* Global Rarity Stats */}
        <div className="bg-[#111927] p-5 rounded-2xl border border-slate-700/80 shadow-xl shrink-0">
          <h2 className="text-lg font-serif font-bold text-indigo-400 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Riepilogo per Rarità
          </h2>
          <p className="text-[10px] text-slate-400 mb-3 leading-tight">
            Probabilità di trovare ALMENO 1 carta di questa rarità in una bustina:
          </p>
          <div className="space-y-2">
            {['mythic', 'legendary', 'epic', 'rare', 'common'].map(r => {
              if (rarityStats[r] === undefined) return null;
              const val = rarityStats[r];
              return (
                <div key={r} className="flex justify-between items-center text-sm">
                  <span className={`capitalize font-bold ${RARITY_COLORS[r]}`}>{r}</span>
                  <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {val >= 99.9 ? '> 99.9%' : `${val.toFixed(1)}%`}
                  </span>
                </div>
              );
            })}
          </div>

          <h2 className="text-lg font-serif font-bold text-teal-400 mt-6 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Riepilogo Varianti
          </h2>
          <p className="text-[10px] text-slate-400 mb-3 leading-tight">
            Probabilità di trovare ALMENO 1 carta di questa specifica variante in una bustina:
          </p>
          <div className="space-y-2">
            {Object.keys(variantStats).length === 0 && (
              <div className="text-xs text-slate-500 italic">Nessuna variante speciale trovata.</div>
            )}
            {Object.entries(variantStats)
              .sort((a, b) => b[1] - a[1])
              .map(([v, val]) => (
                <div key={v} className="flex justify-between items-center text-sm">
                  <span className="capitalize font-bold text-teal-300">
                    {v === 'standard' ? 'Classica Tattile' : v.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {val >= 99.9 ? '> 99.9%' : `${val.toFixed(1)}%`}
                  </span>
                </div>
            ))}
          </div>
        </div>

        {/* Presets di Massa */}
        <div className="bg-[#111927] p-5 rounded-2xl border border-slate-700/80 shadow-xl shrink-0">
          <h2 className="text-lg font-serif font-bold text-amber-500 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Preset di Bilanciamento
          </h2>
          <p className="text-[10px] text-slate-400 mb-3 leading-tight">
            Sovrascrive tutti i pesi attuali con formule matematiche prestabilite.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => applyPreset('standard')} className="text-xs py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition">
              ⚖️ <b>Standard</b> (Rarità Classica)
            </button>
            <button onClick={() => applyPreset('generous')} className="text-xs py-2 px-3 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded-lg text-left transition">
              🎉 <b>Generoso</b> (Mitiche x3, Leggendarie x2)
            </button>
            <button onClick={() => applyPreset('hardcore')} className="text-xs py-2 px-3 bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700/50 rounded-lg text-left transition">
              🔥 <b>Hardcore</b> (Mitiche e Legg. quasi introvabili)
            </button>
          </div>
        </div>
        
        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full shrink-0 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg transition transform active:scale-95"
        >
          <Save className="w-5 h-5" />
          Salva nel Database
        </button>

      </div>

      {/* Main Content - Cards Grid */}
      <div className="flex-1 bg-[#111927] rounded-2xl border border-slate-700/80 shadow-xl flex flex-col relative overflow-hidden">
        <div className="bg-[#111927] z-10 p-4 border-b border-slate-700/50 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-serif font-bold text-slate-200 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            Gestione Miniature
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cerca..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <select 
              value={filterRarity} 
              onChange={e => setFilterRarity(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-400 uppercase font-semibold"
            >
              <option value="all">Tutte</option>
              <option value="mythic">Mitiche</option>
              <option value="legendary">Leggendarie</option>
              <option value="epic">Epiche</option>
              <option value="rare">Rare</option>
              <option value="common">Comuni</option>
            </select>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '24px',
            alignContent: 'start'
          }}
        >
          {filteredGroups.map(group => {
            const groupBaseChance = group.totalWeight / grandTotalWeight;
            const groupPackPercent = (1 - Math.pow(1 - groupBaseChance, 5)) * 100;
            const displayColor = groupPackPercent < 1 ? '#ef4444' : groupPackPercent > 20 ? '#10b981' : '#f59e0b';
            
            return (
              <div key={group.baseName} className="flex flex-col items-center gap-2 group relative">
                {/* Badge percentuale globale */}
                <div 
                  className="absolute -top-3 -right-3 z-10 font-bold px-2 py-1 rounded-lg text-[11px] shadow-lg border"
                  style={{ background: 'rgba(0,0,0,0.8)', borderColor: displayColor, color: displayColor }}
                >
                  {groupPackPercent < 0.1 ? '< 0.1' : groupPackPercent.toFixed(1)}%
                </div>
                
                {/* Il Tile come nella collezione */}
                <div className="transform transition duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(240,165,0,0.4)]">
                  <RealCardTile 
                    card={group.displayCard}
                    onClick={() => setActiveGroup(group)}
                  />
                </div>
                
                <div className="text-center w-full">
                  <div className="text-xs font-bold text-slate-200 truncate">{group.baseName}</div>
                  <div className={`text-[10px] font-bold ${RARITY_COLORS[group.rarity]}`}>{group.variants.length} Varianti</div>
                </div>
              </div>
            );
          })}
          
          {filteredGroups.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
              Nessuna carta trovata con questi filtri.
            </div>
          )}
        </div>
      </div>

      {/* Modal / Menu a Tendina Variante */}
      {activeGroup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveGroup(null)}
        >
          <div 
            className="bg-[#111927] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Left: Big Card Preview */}
            <div className="w-1/3 bg-slate-900/50 p-6 flex flex-col items-center justify-center border-r border-slate-800">
              <RealBigCard card={activeGroup.displayCard} />
              <div className="mt-6 text-center">
                <h2 className="text-2xl font-serif font-bold text-amber-400">{activeGroup.baseName}</h2>
                <p className={`text-sm font-bold uppercase tracking-wider ${RARITY_COLORS[activeGroup.rarity]}`}>{activeGroup.rarity}</p>
              </div>
            </div>

            {/* Right: Sliders Menu */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h3 className="font-serif font-bold text-xl text-slate-200 flex items-center gap-2">
                  <Settings2 className="text-amber-500" />
                  Regola Frequenza Varianti
                </h3>
                <button onClick={() => setActiveGroup(null)} className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeGroup.variants.map(variant => {
                  const variantBaseChance = variant.dropWeight / grandTotalWeight;
                  const variantPackPercent = (1 - Math.pow(1 - variantBaseChance, 5)) * 100;
                  const isZero = variant.dropWeight === 0;
                  
                  let chanceColor = 'text-slate-200';
                  if (variantPackPercent > 20) chanceColor = 'text-emerald-400';
                  else if (variantPackPercent > 5) chanceColor = 'text-amber-400';
                  else if (variantPackPercent > 0.5) chanceColor = 'text-purple-400';
                  else if (variantPackPercent > 0) chanceColor = 'text-rose-400';
                  
                  let averagePacks = 0;
                  if (variantPackPercent > 0) averagePacks = Math.round(100 / variantPackPercent);

                  return (
                    <div key={variant.id} className={`flex flex-col gap-3 p-4 rounded-xl border ${isZero ? 'bg-rose-950/20 border-rose-900/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 transition'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-slate-200 flex items-center gap-2 capitalize">
                          {variant.variant && variant.variant !== 'standard' ? <Sparkles className="w-4 h-4 text-amber-500" /> : null}
                          {(!variant.variant || variant.variant === 'standard') ? 'Classica Tattile' : variant.variant.replace('_', ' ')}
                        </span>
                        
                        <div className="text-right flex items-center gap-4">
                          {!isZero && (
                            <div className="text-right border-r border-slate-700 pr-4">
                              <span className="block text-xs text-slate-400 font-medium">Trovi in media</span>
                              <span className="text-sm font-bold text-indigo-300">1 su {averagePacks} pack</span>
                            </div>
                          )}
                          <div className="min-w-[80px]">
                            <span className={`text-2xl font-bold ${isZero ? 'text-rose-600' : chanceColor}`}>
                              {variantPackPercent < 0.01 && !isZero ? '< 0.01' : variantPackPercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider w-20">Frequenza</span>
                        <input 
                          type="range" 
                          min="0" 
                          max={variant.rarity === 'common' ? "200" : variant.rarity === 'rare' ? "50" : "15"} 
                          step="0.1"
                          value={variant.dropWeight}
                          onChange={(e) => handleUpdateWeight(variant.id, e.target.value)}
                          className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

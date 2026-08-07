import React from 'react';
import { Package, BookOpen, Layers, Swords, Sparkles } from 'lucide-react';
import { soundEngine } from '../engine/soundEngine';

export function Navbar({ activeTab, onTabChange, activeDeckName, unlockedCount, totalCardsCount }) {
  const navItems = [
    { id: 'packs', label: 'Sbustamento 3D', icon: Package, badge: 'Apri' },
    { id: 'album', label: 'Collezione', icon: BookOpen, badge: `${unlockedCount}/${totalCardsCount}` },
    { id: 'decks', label: 'Deck Builder', icon: Layers, badge: activeDeckName },
    { id: 'arena', label: 'Arena Battaglia', icon: Swords, isCta: true },
  ];

  return (
    <header className="bg-[#10161f] border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => { onTabChange('arena'); soundEngine.playButtonClick(); }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="font-serif font-black text-lg tracking-wide text-slate-100 flex items-center gap-1.5">
              CARD CLASH <span className="text-amber-400 text-xs font-sans font-bold px-1.5 py-0.2 bg-amber-400/10 rounded border border-amber-400/30">TCG</span>
            </div>
            <div className="text-[10px] font-sans font-medium text-slate-400">
              Gioco Ufficiale • LAN Arena & Collezione
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Official Game Only) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isCta) {
              return (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); soundEngine.playButtonClick(); }}
                  className="ml-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <Icon className="w-4 h-4 fill-current" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); soundEngine.playButtonClick(); }}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 border ${
                  isActive
                    ? 'bg-slate-800 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-900 text-slate-300 rounded border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}

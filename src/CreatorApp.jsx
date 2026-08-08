import React, { useState, useEffect, useCallback } from 'react';
import { CardStudio } from './components/card-studio/CardStudio';
import { Sparkles, Gamepad2, RefreshCw } from 'lucide-react';
import { soundEngine } from './engine/soundEngine';
import { io } from 'socket.io-client';
import starterCards from './data/starterCards.json';

const STORAGE_KEY_CREATOR = 'card_clash_creator_cards_v2';
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('card_clash_sync') : null;

export function CreatorApp() {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CREATOR);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return starterCards;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [socket, setSocket] = useState(null);

  // Sync to server helper
  const syncCardsToServer = useCallback(async (cardsToSave) => {
    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:4000/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cardsToSave })
      });
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY_CREATOR, JSON.stringify(cardsToSave));
        if (broadcastChannel) {
          broadcastChannel.postMessage({ type: 'CARDS_UPDATED', cards: cardsToSave });
        }
      }
    } catch (err) {
      console.warn('Backend server unreachable, saved locally.', err);
      localStorage.setItem(STORAGE_KEY_CREATOR, JSON.stringify(cardsToSave));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 1. Fetch official cards from server on load
  const fetchServerCards = useCallback(() => {
    fetch('http://localhost:4000/api/cards')
      .then(res => res.json())
      .then(serverCards => {
        if (Array.isArray(serverCards) && serverCards.length > 0) {
          setCards(serverCards);
          localStorage.setItem(STORAGE_KEY_CREATOR, JSON.stringify(serverCards));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchServerCards();

    // Connect socket to listen for real-time changes
    const liveSocket = io('http://localhost:4000');
    setSocket(liveSocket);

    liveSocket.on('cards_updated', ({ cards: updatedCards }) => {
      setCards(updatedCards);
      localStorage.setItem(STORAGE_KEY_CREATOR, JSON.stringify(updatedCards));
    });

    return () => {
      liveSocket.disconnect();
    };
  }, [fetchServerCards]);

  // Save Card (creates or updates, and auto-syncs)
  const handleSaveCard = (newOrUpdatedCard) => {
    setCards(prev => {
      const idx = prev.findIndex(c => c.id === newOrUpdatedCard.id);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newOrUpdatedCard;
      } else {
        updated = [newOrUpdatedCard, ...prev];
      }
      syncCardsToServer(updated);
      return updated;
    });
  };

  // Save/Upsert several cards at once (una sola sync) — usato dalla generazione varianti
  const handleSaveMultipleCards = (newCards) => {
    if (!Array.isArray(newCards) || newCards.length === 0) return;
    setCards(prev => {
      const byId = new Map(prev.map(c => [c.id, c]));
      newCards.forEach(c => byId.set(c.id, c));
      const updated = Array.from(byId.values());
      syncCardsToServer(updated);
      return updated;
    });
  };

  // Delete Card
  const handleDeleteCard = (cardId) => {
    setCards(prev => {
      const updated = prev.filter(c => c.id !== cardId);
      syncCardsToServer(updated);
      return updated;
    });
  };

  // Delete Multiple Cards
  const handleDeleteMultipleCards = (cardIds) => {
    const idsSet = new Set(cardIds);
    setCards(prev => {
      const updated = prev.filter(c => !idsSet.has(c.id));
      syncCardsToServer(updated);
      return updated;
    });
  };

  // Reset / Clear all cards
  const handleResetAllCards = () => {
    if (window.confirm('Vuoi davvero cancellare TUTTE le carte e ripartire da zero?')) {
      const empty = [];
      setCards(empty);
      syncCardsToServer(empty);
    }
  };

  // Manual Publish to Server
  const handlePublishCards = async (cardsToPublish) => {
    await syncCardsToServer(cardsToPublish);
    return { success: true, count: cardsToPublish.length };
  };

  const handleExportCards = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `card_clash_set_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportCards = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            setCards(imported);
            syncCardsToServer(imported);
            soundEngine.playCardPlay();
            alert(`Importate con successo ${imported.length} carte!`);
          }
        } catch (err) {
          alert('Errore nella lettura del file JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1015] text-slate-100 flex flex-col justify-between">
      
      {/* Creator Top Navbar */}
      <header className="bg-[#10161f] border-b border-slate-800 sticky top-0 z-40 px-4 py-3 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-serif font-black text-lg tracking-wide text-slate-100 flex items-center gap-2">
                CARD CLASH <span className="text-amber-400 text-xs font-sans font-bold px-2 py-0.5 bg-amber-400/10 rounded-full border border-amber-400/30">STUDIO CREATORE</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span>Pannello di Creazione Carte</span>
                {isSyncing && (
                  <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                    • <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Sincronizzazione in corso...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchServerCards}
              title="Ricarica dal server"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition shadow"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Passa al Gioco Ufficiale</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Studio View */}
      <main className="flex-1 py-4">
        <CardStudio
          cards={cards}
          onSaveCard={handleSaveCard}
          onSaveMultipleCards={handleSaveMultipleCards}
          onDeleteCard={handleDeleteCard}
          onDeleteMultipleCards={handleDeleteMultipleCards}
          onResetAllCards={handleResetAllCards}
          onPublishCards={handlePublishCards}
          onExportCards={handleExportCards}
          onImportCards={handleImportCards}
        />
      </main>

      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 flex items-center justify-between max-w-7xl mx-auto w-full">
        <span>Card Clash • Studio Creatore Riservato</span>
        <span className="text-[11px] text-emerald-400/80">● Auto-sync in tempo reale attivo</span>
      </footer>

    </div>
  );
}

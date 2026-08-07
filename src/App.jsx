import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PackOpener } from './components/pack-opening/PackOpener';
import { CollectionAlbum } from './components/pack-opening/CollectionAlbum';
import { DeckBuilder } from './components/deck-builder/DeckBuilder';
import { GameBoard } from './components/arena/GameBoard';
import { LobbyModal } from './components/multiplayer/LobbyModal';
import { CreatorApp } from './CreatorApp';
import { createInitialGameState } from './engine/gameEngine';
import { io } from 'socket.io-client';
import { Sparkles, Swords, Package, RefreshCw } from 'lucide-react';
import starterCards from './data/starterCards.json';

const STORAGE_KEYS = {
  CARDS: 'card_clash_official_cards_v3',
  COLLECTION: 'card_clash_collection_v3',
  DECKS: 'card_clash_decks_v3',
  ACTIVE_DECK: 'card_clash_active_deck_v3'
};

const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('card_clash_sync') : null;

export function App() {
  // Check if Creator Studio route is active
  const isCreatorRoute = window.location.pathname.includes('/creator') || window.location.hash.includes('creator');
  if (isCreatorRoute) {
    return <CreatorApp />;
  }

  // 1. CARDS DATABASE STATE (Synced with server & starterCards fallback)
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return starterCards;
  });

  // 2. PLAYER COLLECTION STATE
  const [collection, setCollection] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COLLECTION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial = {};
    starterCards.forEach(c => { initial[c.id] = 2; });
    return initial;
  });

  // 3. DECKS STATE
  const [decks, setDecks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'deck_1',
        name: 'Mazzo Principale',
        cardIds: starterCards.map(c => c.id)
      }
    ];
  });

  const [activeDeckId, setActiveDeckId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_DECK) || 'deck_1';
  });

  // Navigation & Game State
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' | 'album' | 'decks' | 'arena'
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);

  // LAN Server Info & Socket
  const [lanInfo, setLanInfo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper to synchronize incoming cards with collection and decks
  const applyUpdatedCards = useCallback((newCards) => {
    if (!Array.isArray(newCards)) return;
    setCards(newCards);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(newCards));

    // Update collection: grant copies for any new card and prune deleted ones
    setCollection(prev => {
      const validIds = new Set(newCards.map(c => c.id));
      const updated = {};
      newCards.forEach(c => {
        updated[c.id] = prev[c.id] !== undefined ? prev[c.id] : 2;
      });
      localStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(updated));
      return updated;
    });

    // Update decks: prune invalid card IDs and ensure deck is valid
    setDecks(prevDecks => {
      const validIds = new Set(newCards.map(c => c.id));
      const updated = prevDecks.map(d => {
        const cleanedIds = (d.cardIds || []).filter(id => validIds.has(id));
        // If deck became too short, backfill with available cards
        const finalIds = cleanedIds.length > 0 ? cleanedIds : newCards.slice(0, 15).map(c => c.id);
        return { ...d, cardIds: finalIds };
      });
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DECK, activeDeckId);
  }, [activeDeckId]);

  // Fetch cards manually or on trigger
  const refreshCardsFromServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:4000/api/cards');
      if (res.ok) {
        const serverCards = await res.json();
        if (Array.isArray(serverCards) && serverCards.length > 0) {
          applyUpdatedCards(serverCards);
        }
      }
    } catch (err) {
      console.log('Backend server check:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [applyUpdatedCards]);

  // Fetch LAN Server info and published official cards
  useEffect(() => {
    // 1. Fetch server info
    fetch('http://localhost:4000/api/info')
      .then(res => res.json())
      .then(data => setLanInfo(data))
      .catch(() => {
        setLanInfo({ ip: 'localhost', port: 4000 });
      });

    // 2. Fetch published official cards
    refreshCardsFromServer();

    // 3. Connect real-time socket to listen for cards updates published by Creator
    const liveSocket = io('http://localhost:4000');
    liveSocket.on('cards_updated', ({ cards: updatedCards }) => {
      console.log('[LIVE SYNC] Ricevuto set di carte aggiornato dal Creatore!', updatedCards);
      applyUpdatedCards(updatedCards);
    });

    // 4. Tab BroadcastChannel listener
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'CARDS_UPDATED' && Array.isArray(event.data.cards)) {
          applyUpdatedCards(event.data.cards);
        }
      };
    }

    return () => {
      liveSocket.disconnect();
    };
  }, [refreshCardsFromServer, applyUpdatedCards]);

  // Pack Opener Collection Handler
  const handleAddCardsToCollection = (newCards) => {
    setCollection(prev => {
      const updated = { ...prev };
      newCards.forEach(c => {
        updated[c.id] = (updated[c.id] || 0) + 1;
      });
      return updated;
    });
  };

  // Start Solo Game vs AI
  const handleStartSoloGame = (playerName) => {
    const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];
    const playerDeckCards = (activeDeck.cardIds || []).map(id => cards.find(c => c.id === id)).filter(Boolean);
    const validCards = cards.length > 0 ? cards : starterCards;
    const opponentDeckCards = validCards.slice(0, 15);

    const initialGameState = createInitialGameState(
      playerDeckCards.length >= 3 ? playerDeckCards : validCards,
      opponentDeckCards.length >= 3 ? opponentDeckCards : validCards,
      playerName || 'Tu',
      'AI Bot Arena'
    );

    setActiveMatch({
      gameState: initialGameState,
      isMultiplayer: false
    });
    setShowLobbyModal(false);
  };

  // Host LAN Multiplayer Game
  const handleHostLanGame = ({ roomId, playerName, hostUrl }) => {
    setIsConnecting(true);
    setConnectionError(null);

    const newSocket = io(hostUrl || 'http://localhost:4000');
    setSocket(newSocket);

    const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];
    const playerDeckCards = (activeDeck.cardIds || []).map(id => cards.find(c => c.id === id)).filter(Boolean);
    const validDeck = playerDeckCards.length >= 3 ? playerDeckCards : cards;

    newSocket.emit('host_room', {
      roomId,
      playerName,
      deck: validDeck
    });

    newSocket.on('room_created', () => {
      console.log('Room created successfully');
    });

    newSocket.on('player_joined', ({ guest }) => {
      setIsConnecting(false);
      const guestDeckCards = guest.deck?.length >= 3 ? guest.deck : cards.slice(0, 12);
      const initialGameState = createInitialGameState(
        validDeck,
        guestDeckCards,
        playerName,
        guest.name
      );

      // Sync state to guest
      newSocket.emit('sync_game_state', { roomId, gameState: initialGameState });

      setActiveMatch({
        gameState: initialGameState,
        isMultiplayer: true,
        isHost: true,
        socket: newSocket,
        roomId
      });
      setShowLobbyModal(false);
    });
  };

  // Join LAN Multiplayer Game
  const handleJoinLanGame = ({ roomId, playerName, hostUrl }) => {
    setIsConnecting(true);
    setConnectionError(null);

    const newSocket = io(hostUrl);
    setSocket(newSocket);

    const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];
    const playerDeckCards = (activeDeck.cardIds || []).map(id => cards.find(c => c.id === id)).filter(Boolean);
    const validDeck = playerDeckCards.length >= 3 ? playerDeckCards : cards;

    newSocket.emit('join_room', {
      roomId,
      playerName,
      deck: validDeck
    });

    newSocket.on('join_error', ({ message }) => {
      setIsConnecting(false);
      setConnectionError(message);
    });

    newSocket.on('game_state_synced', ({ gameState }) => {
      setIsConnecting(false);
      setActiveMatch({
        gameState,
        isMultiplayer: true,
        isHost: false,
        socket: newSocket,
        roomId
      });
      setShowLobbyModal(false);
    });
  };

  const handleExitMatch = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setActiveMatch(null);
    setActiveTab('arena');
  };

  const activeDeck = decks.find(d => d.id === activeDeckId) || decks[0];
  const unlockedCount = cards.filter(c => (collection[c.id] || 0) > 0).length;

  // Active Match View
  if (activeMatch) {
    return (
      <GameBoard 
        initialGameState={activeMatch.gameState}
        isMultiplayer={activeMatch.isMultiplayer}
        isHost={activeMatch.isHost}
        socket={activeMatch.socket}
        roomId={activeMatch.roomId}
        onExitGame={handleExitMatch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1015] text-slate-100 flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'arena') {
            setShowLobbyModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        activeDeckName={activeDeck?.name || 'Mazzo Principale'}
        unlockedCount={unlockedCount}
        totalCardsCount={cards.length}
      />

      {/* Main Tab Content */}
      <main className="flex-1 py-4">
        
        {/* Warning if no cards are published yet */}
        {cards.length === 0 && (
          <div className="max-w-2xl mx-auto p-6 text-center my-8 bg-amber-950/40 border border-amber-500/50 rounded-2xl shadow-xl">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold font-serif text-amber-300">
              Nessuna Carta nel Set Ufficiale
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              Le carte vecchie sono state azzerate. Apri il <strong>Card Creator Studio</strong> per creare le nuove carte e verranno sincronizzate qui in tempo reale!
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <a
                href="/#creator"
                className="inline-block px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow transition"
              >
                Apri Card Creator Studio →
              </a>
              <button
                onClick={refreshCardsFromServer}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizza Ora
              </button>
            </div>
          </div>
        )}

        {cards.length > 0 && activeTab === 'packs' && (
          <PackOpener 
            availableCards={cards}
            onAddCardsToCollection={handleAddCardsToCollection}
          />
        )}

        {cards.length > 0 && activeTab === 'album' && (
          <CollectionAlbum 
            collection={collection}
            allCards={cards}
          />
        )}

        {cards.length > 0 && activeTab === 'decks' && (
          <DeckBuilder 
            allCards={cards}
            decks={decks}
            activeDeckId={activeDeckId}
            onSaveDecks={setDecks}
            onSetActiveDeck={setActiveDeckId}
          />
        )}

        {cards.length > 0 && activeTab === 'arena' && !activeMatch && (
          <div className="max-w-4xl mx-auto p-6 text-center">
            <div className="p-12 bg-[#121820] border-2 border-slate-800 rounded-3xl shadow-2xl">
              <h1 className="text-4xl font-black font-serif text-slate-100 mb-3">
                ⚔️ Pronto per la Battaglia?
              </h1>
              <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8">
                Sfida Antonio su rete locale (LAN) o allenati contro l'Intelligenza Artificiale con le tue carte!
              </p>

              <button
                onClick={() => setShowLobbyModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-lg rounded-2xl shadow-xl shadow-amber-500/25 transition-transform transform hover:scale-105"
              >
                Apri Arena di Combattimento
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Lobby Modal for LAN or AI Match Selection */}
      {showLobbyModal && (
        <LobbyModal 
          onStartSoloGame={handleStartSoloGame}
          onHostLanGame={handleHostLanGame}
          onJoinLanGame={handleJoinLanGame}
          lanInfo={lanInfo}
          isConnecting={isConnecting}
          connectionError={connectionError}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>Card Clash: Custom TCG Arena • Gioco Ufficiale</span>
          <button
            onClick={refreshCardsFromServer}
            title="Forza sincronizzazione carte dal server"
            className="text-slate-400 hover:text-amber-300 flex items-center gap-1 text-[11px] ml-2 underline"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizza Carte
          </button>
        </div>
        <a 
          href="/#creator" 
          className="text-slate-400 hover:text-amber-300 transition text-[11px] underline"
        >
          Accesso Studio Creatore (Riservato)
        </a>
      </footer>

    </div>
  );
}

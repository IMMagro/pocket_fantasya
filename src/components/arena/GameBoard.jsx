import React, { useState, useEffect } from 'react';
import { TactileCard } from '../card/TactileCard';
import { Swords, Shield, Heart, Zap, RotateCcw, ArrowRight, Trophy, Skull, Bot, Volume2, User } from 'lucide-react';
import { playCard, attackTarget, endTurn } from '../../engine/gameEngine';
import { executeAiTurn } from '../../engine/aiBot';
import { soundEngine } from '../../engine/soundEngine';
import confetti from 'canvas-confetti';

export function GameBoard({ 
  initialGameState, 
  isMultiplayer = false, 
  isHost = true, 
  socket = null, 
  roomId = null, 
  onExitGame 
}) {
  const [gameState, setGameState] = useState(initialGameState);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const isMyTurn = isMultiplayer 
    ? (isHost ? gameState.currentTurn === 'player' : gameState.currentTurn === 'opponent')
    : gameState.currentTurn === 'player';

  // Handle AI turn triggers in Solo mode
  useEffect(() => {
    if (!isMultiplayer && gameState.currentTurn === 'opponent' && !gameState.winner && !isAiThinking) {
      setIsAiThinking(true);
      executeAiTurn(
        gameState,
        (updatedState) => setGameState(updatedState),
        (soundType) => {
          if (soundType === 'attack') soundEngine.playAttack();
          if (soundType === 'damage') soundEngine.playDamage();
          if (soundType === 'card_play') soundEngine.playCardPlay();
          if (soundType === 'turn_end') soundEngine.playButtonClick();
        }
      ).then(() => {
        setIsAiThinking(false);
      });
    }
  }, [gameState.currentTurn, gameState.winner, isMultiplayer]);

  // Handle Socket.io multiplayer events
  useEffect(() => {
    if (isMultiplayer && socket) {
      const handleOpponentAction = ({ action, payload }) => {
        if (action === 'play_card') {
          soundEngine.playCardPlay();
          setGameState(prev => playCard(prev, !isHost, payload.cardInstanceId, payload.targetId));
        } else if (action === 'attack') {
          soundEngine.playAttack();
          setGameState(prev => attackTarget(prev, !isHost, payload.attackerId, payload.targetType, payload.targetInstanceId));
        } else if (action === 'end_turn') {
          soundEngine.playButtonClick();
          setGameState(prev => endTurn(prev));
        }
      };

      socket.on('opponent_action', handleOpponentAction);
      return () => {
        socket.off('opponent_action', handleOpponentAction);
      };
    }
  }, [isMultiplayer, socket, isHost]);

  // Trigger victory fanfare
  useEffect(() => {
    if (gameState.winner) {
      const didIWin = isMultiplayer 
        ? (isHost ? gameState.winner === 'player' : gameState.winner === 'opponent')
        : gameState.winner === 'player';

      if (didIWin) {
        soundEngine.playLegendaryFanfare();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 }
        });
      } else {
        soundEngine.playDamage();
      }
    }
  }, [gameState.winner, isMultiplayer, isHost]);

  // Click on Card in Hand -> Play it
  const handleCardClick = (card) => {
    if (!isMyTurn || gameState.winner) return;
    
    const myHero = isMultiplayer && !isHost ? gameState.opponent : gameState.player;
    if (myHero.mana < card.cost) {
      soundEngine.playDamage();
      return;
    }

    soundEngine.playCardPlay();
    const updatedState = playCard(gameState, isMultiplayer ? isHost : true, card.instanceId);
    setGameState(updatedState);
    setSelectedCardId(null);
    setSelectedAttackerId(null);

    if (isMultiplayer && socket && roomId) {
      socket.emit('game_action', {
        roomId,
        action: 'play_card',
        payload: { cardInstanceId: card.instanceId }
      });
    }
  };

  // Click on Friendly Minion -> Select Attacker
  const handleFriendlyMinionClick = (minion) => {
    if (!isMyTurn || gameState.winner || !minion.canAttack) return;
    
    soundEngine.playButtonClick();
    if (selectedAttackerId === minion.instanceId) {
      setSelectedAttackerId(null);
    } else {
      setSelectedAttackerId(minion.instanceId);
    }
  };

  // Click on Target (Enemy Minion or Enemy Hero) -> Execute Attack
  const handleTargetClick = (targetType, targetMinionId = null) => {
    if (!isMyTurn || !selectedAttackerId || gameState.winner) return;

    soundEngine.playAttack();
    const updatedState = attackTarget(
      gameState, 
      isMultiplayer ? isHost : true, 
      selectedAttackerId, 
      targetType, 
      targetMinionId
    );

    setGameState(updatedState);
    setSelectedAttackerId(null);

    if (isMultiplayer && socket && roomId) {
      socket.emit('game_action', {
        roomId,
        action: 'attack',
        payload: {
          attackerId: selectedAttackerId,
          targetType,
          targetInstanceId: targetMinionId
        }
      });
    }
  };

  // End Turn Button
  const handleEndTurn = () => {
    if (!isMyTurn || gameState.winner || isAiThinking) return;

    soundEngine.playButtonClick();
    setSelectedAttackerId(null);
    setSelectedCardId(null);
    const updatedState = endTurn(gameState);
    setGameState(updatedState);

    if (isMultiplayer && socket && roomId) {
      socket.emit('game_action', {
        roomId,
        action: 'end_turn',
        payload: {}
      });
    }
  };

  const myState = isMultiplayer && !isHost ? gameState.opponent : gameState.player;
  const oppState = isMultiplayer && !isHost ? gameState.player : gameState.opponent;

  return (
    <div className="w-full min-h-screen bg-[#0d1217] text-slate-100 p-2 md:p-4 flex flex-col justify-between select-none relative overflow-hidden">
      
      {/* Top Bar: Match Info & Navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141a22] border border-slate-800 rounded-xl mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitGame}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            ← Abbandona Partita
          </button>
          <span className="text-xs font-mono text-slate-400">
            Turno #{gameState.turnNumber}
          </span>
        </div>

        {/* Turn Status Banner */}
        <div className="flex items-center gap-2">
          <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
            isMyTurn ? 'bg-amber-500 text-black animate-pulse' : 'bg-slate-800 text-slate-400'
          }`}>
            {isMyTurn ? '⚔️ IL TUO TURNO' : '⏳ TURNO AVVERSARIO'}
          </div>
          {isAiThinking && (
            <span className="text-xs text-amber-400 animate-pulse font-semibold">
              (L'AI sta pensando...)
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {isMultiplayer ? `🌐 LAN Room: ${roomId}` : '🤖 Solo vs AI'}
        </div>
      </div>

      {/* Main Board Arena Layout (Grid with Opponent, Field, Player & Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        
        {/* Arena Center (9 cols) */}
        <div className="lg:col-span-9 flex flex-col justify-between gap-3 bg-[#121820] border border-slate-800 rounded-2xl p-3 relative">
          
          {/* OPPONENT HERO ZONE */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-800">
            {/* Opponent Avatar & Health */}
            <div 
              onClick={() => selectedAttackerId && handleTargetClick('hero')}
              className={`flex items-center gap-3 cursor-pointer p-1.5 rounded-lg transition ${
                selectedAttackerId ? 'ring-2 ring-rose-500 hover:bg-rose-950/40 animate-pulse' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-lg text-slate-300 relative shadow">
                <Bot className="w-6 h-6 text-rose-400" />
                {selectedAttackerId && (
                  <div className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                    COLPISCI
                  </div>
                )}
              </div>
              <div>
                <div className="font-serif font-bold text-sm text-slate-200">
                  {oppState.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/40">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {oppState.hp} / 30
                  </span>
                  {oppState.shield > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3" /> {oppState.shield}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Opponent Mana Gems */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold font-mono text-sky-400 mr-1.5">
                💎 {oppState.mana}/{oppState.maxMana}
              </span>
              {Array.from({ length: oppState.maxMana }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-4 rounded-sm transform skew-x-[-12deg] ${
                    i < oppState.mana ? 'bg-sky-400 shadow-glow-cyan' : 'bg-slate-800'
                  }`} 
                />
              ))}
            </div>

            {/* Opponent Hand (Card Backs) */}
            <div className="flex items-center gap-1">
              {oppState.hand.map((_, i) => (
                <div 
                  key={i} 
                  className="w-7 h-10 rounded bg-slate-800 border border-slate-700 shadow-sm"
                />
              ))}
            </div>
          </div>

          {/* OPPONENT BATTLEFIELD CREATURES (COMBAT VIEW: BIG IMAGE + HOVER EFFECT) */}
          <div className="flex items-center justify-center gap-4 min-h-[160px] p-3 bg-black/20 rounded-xl border border-slate-800/60 flex-wrap">
            {oppState.board.length === 0 ? (
              <span className="text-xs text-slate-600 font-serif italic">
                Nessuna creatura nemica in campo
              </span>
            ) : (
              oppState.board.map(minion => (
                <div 
                  key={minion.instanceId}
                  onClick={() => selectedAttackerId && handleTargetClick('minion', minion.instanceId)}
                  className={`transform hover:scale-105 transition cursor-pointer relative ${
                    selectedAttackerId ? 'ring-4 ring-rose-500 rounded-2xl animate-pulse' : ''
                  }`}
                >
                  <TactileCard 
                    card={minion}
                    size="sm"
                    combatView={true}
                    interactive={false}
                  />
                </div>
              ))
            )}
          </div>

          {/* CENTER COMBAT DIVIDER & END TURN BUTTON */}
          <div className="flex items-center justify-between px-4 py-1">
            <div className="h-px bg-slate-800 flex-1" />
            
            <button
              onClick={handleEndTurn}
              disabled={!isMyTurn || isAiThinking || gameState.winner}
              className={`mx-4 px-6 py-2 rounded-xl font-serif font-extrabold text-sm tracking-wider transition shadow-lg flex items-center gap-2 ${
                isMyTurn
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black scale-105 shadow-amber-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              FINE TURNO <ArrowRight className="w-4 h-4" />
            </button>

            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* PLAYER BATTLEFIELD CREATURES (COMBAT VIEW: BIG IMAGE + HOVER EFFECT) */}
          <div className="flex items-center justify-center gap-4 min-h-[160px] p-3 bg-black/20 rounded-xl border border-slate-800/60 flex-wrap">
            {myState.board.length === 0 ? (
              <span className="text-xs text-slate-600 font-serif italic">
                Gioca le carte dalla tua mano per evocarle in campo
              </span>
            ) : (
              myState.board.map(minion => {
                const isAttacker = selectedAttackerId === minion.instanceId;
                const canAttack = minion.canAttack && isMyTurn;

                return (
                  <div 
                    key={minion.instanceId}
                    onClick={() => handleFriendlyMinionClick(minion)}
                    className={`transform transition cursor-pointer relative ${
                      isAttacker 
                        ? 'scale-110 ring-4 ring-cyan-400 rounded-2xl shadow-glow-cyan z-10' 
                        : canAttack 
                          ? 'ring-2 ring-emerald-400/80 rounded-2xl hover:scale-105' 
                          : 'opacity-80'
                    }`}
                  >
                    <TactileCard 
                      card={minion}
                      size="sm"
                      combatView={true}
                      interactive={false}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* PLAYER HERO & HAND ZONE */}
          <div className="flex flex-col gap-2">
            
            {/* Player Hand (Fanned / Full Tactile Cards) */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-1 min-h-[170px]">
              {myState.hand.map((card) => {
                const isAffordable = myState.mana >= card.cost && isMyTurn;

                return (
                  <div
                    key={card.instanceId}
                    onClick={() => handleCardClick(card)}
                    className={`transform transition duration-200 hover:-translate-y-4 hover:z-20 cursor-pointer ${
                      isAffordable ? 'ring-2 ring-amber-400/90 rounded-2xl' : 'opacity-60'
                    }`}
                  >
                    <TactileCard 
                      card={card}
                      size="sm"
                      combatView={false}
                      interactive={false}
                    />
                  </div>
                );
              })}
            </div>

            {/* Player Hero Info Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-500 flex items-center justify-center font-bold text-lg text-amber-300 shadow">
                  <User className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="font-serif font-bold text-sm text-slate-100">
                    {myState.name} (Tu)
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800/40">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {myState.hp} / 30
                    </span>
                    {myState.shield > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> {myState.shield}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Player Mana Gems */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold font-mono text-sky-400 mr-1.5">
                  💎 {myState.mana}/{myState.maxMana}
                </span>
                {Array.from({ length: myState.maxMana }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 h-5 rounded-sm transform skew-x-[-12deg] transition-colors ${
                      i < myState.mana ? 'bg-sky-400 shadow-glow-cyan' : 'bg-slate-800'
                    }`} 
                  />
                ))}
              </div>

              <div className="text-xs font-mono text-slate-400">
                Mazzo: <span className="font-bold text-slate-200">{myState.deck.length}</span> carte
              </div>
            </div>

          </div>

        </div>

        {/* Right Sidebar: Combat Action Log & Instructions (3 cols) */}
        <div className="lg:col-span-3 bg-[#121820] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between max-h-[820px]">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
              <span>Registro Battaglia</span>
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            </div>

            {/* Live Combat Log List */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {gameState.combatLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`text-[11px] p-2 rounded-lg border leading-tight ${
                    log.type === 'attack' || log.type === 'damage'
                      ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                      : log.type === 'summon'
                        ? 'bg-amber-950/40 border-amber-900/50 text-amber-300'
                        : log.type === 'spell'
                          ? 'bg-sky-950/40 border-sky-900/50 text-sky-300'
                          : log.type === 'death'
                            ? 'bg-slate-900 border-slate-800 text-slate-400 font-mono'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Controls Tip */}
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 text-xs">💡 Modalità Combattimento:</div>
            <div>• Le creature sul campo mostrano l'illustrazione in grande.</div>
            <div>• Passa il mouse sopra una carta in campo per leggere l'abilità e l'effetto completo!</div>
          </div>

        </div>

      </div>

      {/* GAME OVER MODAL (Victory or Defeat) */}
      {gameState.winner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121820] border-2 border-amber-500/80 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
            {gameState.winner === (isMultiplayer && !isHost ? 'opponent' : 'player') ? (
              <>
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
                <h2 className="text-3xl font-serif font-black text-amber-300">
                  VITTORIA GLORIOSA!
                </h2>
                <p className="text-slate-300 text-sm mt-2">
                  Hai annientato l'Eroe avversario con la tua strategia suprema!
                </p>
              </>
            ) : (
              <>
                <Skull className="w-16 h-16 text-rose-500 mx-auto mb-3" />
                <h2 className="text-3xl font-serif font-black text-rose-400">
                  SCONFITTA!
                </h2>
                <p className="text-slate-300 text-sm mt-2">
                  I tuoi punti vita sono scesi a 0. Riprova con un nuovo mazzo!
                </p>
              </>
            )}

            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={onExitGame}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl transition shadow-lg"
              >
                Torna al Menu Principale
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

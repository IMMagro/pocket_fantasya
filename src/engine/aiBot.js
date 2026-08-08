import { playCard, attackTarget, endTurn, getCardEffectiveCost } from './gameEngine';

// AI Bot turn automation with simulated delays
export async function executeAiTurn(gameState, onStateUpdate, onSoundTrigger) {
  let currentState = JSON.parse(JSON.stringify(gameState));

  // 1. Play Cards from Hand (considering dynamic costs like Lettore CIE)
  const playableCards = currentState.opponent.hand
    .filter(c => getCardEffectiveCost(c, currentState.opponent) <= currentState.opponent.mana)
    .sort((a, b) => getCardEffectiveCost(b, currentState.opponent) - getCardEffectiveCost(a, currentState.opponent));

  for (const card of playableCards) {
    const cost = getCardEffectiveCost(card, currentState.opponent);
    if (currentState.opponent.mana >= cost) {
      await new Promise(r => setTimeout(r, 600));
      currentState = playCard(currentState, false, card.instanceId);
      if (onSoundTrigger) onSoundTrigger('card_play');
      onStateUpdate(currentState);
    }
  }

  // 2. Attack with Ready Minions
  const readyMinions = currentState.opponent.board.filter(m => m.canAttack);

  for (const minion of readyMinions) {
    await new Promise(r => setTimeout(r, 700));

    const playerBoard = currentState.player.board;
    const playerTaunts = playerBoard.filter(m => m.hasTaunt);

    if (playerTaunts.length > 0) {
      // Deve colpire prima un GUARDIANO
      const targetTaunt = playerTaunts[0];
      currentState = attackTarget(currentState, false, minion.instanceId, 'minion', targetTaunt.instanceId);
      if (onSoundTrigger) onSoundTrigger('attack');
      onStateUpdate(currentState);
    } else if (playerBoard.length > 0) {
      // Ci sono creature: obbligato ad affrontarle (niente attacco diretto all'Eroe).
      // Sceglie il bersaglio con meno HP (kill) o comunque il primo disponibile.
      const targetMinion = [...playerBoard].sort((a, b) => (a.currentHp ?? a.hp) - (b.currentHp ?? b.hp))[0];
      currentState = attackTarget(currentState, false, minion.instanceId, 'minion', targetMinion.instanceId);
      if (onSoundTrigger) onSoundTrigger('attack');
      onStateUpdate(currentState);
    } else {
      // Campo libero: attacca l'Eroe
      currentState = attackTarget(currentState, false, minion.instanceId, 'hero');
      if (onSoundTrigger) onSoundTrigger('damage');
      onStateUpdate(currentState);
    }

    if (currentState.winner) break;
  }

  // 3. End Turn
  await new Promise(r => setTimeout(r, 600));
  currentState = endTurn(currentState);
  if (onSoundTrigger) onSoundTrigger('turn_end');
  onStateUpdate(currentState);
}

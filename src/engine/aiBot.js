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
    // Rispetta il limite di 5 creature in campo
    if (card.type === 'CREATURA' && currentState.opponent.board.length >= 5) continue;
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
      if (onSoundTrigger) onSoundTrigger('attack', { attackerId: minion.instanceId, targetKey: targetTaunt.instanceId, damage: minion.atk });
      currentState = attackTarget(currentState, false, minion.instanceId, 'minion', targetTaunt.instanceId);
      onStateUpdate(currentState);
    } else if (playerBoard.length > 0) {
      // Ci sono creature: obbligato ad affrontarle (niente attacco diretto all'Eroe).
      // Sceglie il bersaglio con meno HP (kill) o comunque il primo disponibile.
      const targetMinion = [...playerBoard].sort((a, b) => (a.currentHp ?? a.hp) - (b.currentHp ?? b.hp))[0];
      if (onSoundTrigger) onSoundTrigger('attack', { attackerId: minion.instanceId, targetKey: targetMinion.instanceId, damage: minion.atk });
      currentState = attackTarget(currentState, false, minion.instanceId, 'minion', targetMinion.instanceId);
      onStateUpdate(currentState);
    } else {
      // Campo libero: attacca l'Eroe
      if (onSoundTrigger) onSoundTrigger('attack', { attackerId: minion.instanceId, targetKey: 'hero_player', damage: minion.atk });
      currentState = attackTarget(currentState, false, minion.instanceId, 'hero');
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

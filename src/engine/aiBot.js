import { playCard, attackTarget, endTurn } from './gameEngine';

// AI Bot turn automation with simulated delays
export async function executeAiTurn(gameState, onStateUpdate, onSoundTrigger) {
  let currentState = JSON.parse(JSON.stringify(gameState));

  // 1. Play Cards from Hand
  const playableCards = currentState.opponent.hand
    .filter(c => c.cost <= currentState.opponent.mana)
    .sort((a, b) => b.cost - a.cost);

  for (const card of playableCards) {
    if (currentState.opponent.mana >= card.cost) {
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

    // Check if player has taunts
    const playerTaunts = currentState.player.board.filter(m => m.hasTaunt);

    if (playerTaunts.length > 0) {
      // Attack highest threat or lowest HP taunt
      const targetTaunt = playerTaunts[0];
      currentState = attackTarget(currentState, false, minion.instanceId, 'minion', targetTaunt.instanceId);
      if (onSoundTrigger) onSoundTrigger('attack');
      onStateUpdate(currentState);
    } else if (currentState.player.board.length > 0 && Math.random() < 0.45) {
      // 45% chance to trade with minion if beneficial
      const targetMinion = currentState.player.board[0];
      currentState = attackTarget(currentState, false, minion.instanceId, 'minion', targetMinion.instanceId);
      if (onSoundTrigger) onSoundTrigger('attack');
      onStateUpdate(currentState);
    } else {
      // Go Face (Attack Hero)
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

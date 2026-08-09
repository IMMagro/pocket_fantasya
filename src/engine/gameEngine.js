// Card Clash Combat & Game Engine

// ============================================================
// TOKEN REGISTRY & FACTORY
// Definizioni predefinite per le creature/token evocati da abilità speciali.
// ============================================================

export const TOKEN_REGISTRY = {
  'davide_forma_1': {
    name: 'Davide Forma 1°',
    type: 'CREATURA',
    cost: 2,
    atk: 2,
    hp: 3,
    rarity: 'rare',
    variant: 'standard',
    accentColor: '#d97706',
    imageUrl: '/illustrations/mattolone.png',
    abilityTitle: 'GESTIONE RECLAMI',
    abilityText: 'GUARDIANO: I nemici devono attaccare questo servitore prima dell\'Eroe.',
    flavorText: '«Ci sarebbe da verificare il modulo B-42...»'
  },
  'cliente_insoddisfatta': {
    name: 'Cliente insoddisfatta',
    type: 'CREATURA',
    cost: 1,
    atk: 1,
    hp: 2,
    rarity: 'common',
    variant: 'standard',
    accentColor: '#0284c7',
    imageUrl: '/illustrations/tralalero_brainrot.png',
    abilityTitle: 'RECLAMO',
    abilityText: '',
    flavorText: '«È due ore che chiamo l\'assistenza!»'
  }
};

export function createTokenMinion(tokenKeyOrName, isPlayer, seq = 1) {
  const normalized = String(tokenKeyOrName || '').toLowerCase().trim();
  let baseTemplate = null;

  if (normalized.includes('davide') || normalized.includes('forma 1')) {
    baseTemplate = TOKEN_REGISTRY['davide_forma_1'];
  } else if (normalized.includes('cliente') || normalized.includes('insoddisfatt')) {
    baseTemplate = TOKEN_REGISTRY['cliente_insoddisfatta'];
  } else {
    // Generic token
    baseTemplate = {
      name: tokenKeyOrName || 'Token Rinforzo',
      type: 'CREATURA',
      cost: 1,
      atk: 1,
      hp: 1,
      rarity: 'common',
      variant: 'standard',
      accentColor: '#6C8D88',
      imageUrl: '',
      abilityTitle: 'RINFORZO',
      abilityText: '',
      flavorText: 'Evocato da un effetto speciale sul campo.'
    };
  }

  const prefix = isPlayer ? 'p_token' : 'o_token';
  const instanceId = `${prefix}_${Date.now()}_${seq}`;
  const abilities = parseAbility(baseTemplate.abilityText);

  return {
    ...baseTemplate,
    instanceId,
    currentHp: baseTemplate.hp,
    canAttack: false, // Summoning sickness
    hasTaunt: abilities.taunt,
    thorns: abilities.thorns,
    hasShield: abilities.divineShield,
    turnTriggers: abilities.turnTriggers || [],
    deathrattle: abilities.deathrattle || []
  };
}

// ============================================================
// ABILITY PARSER (NLP)
// Le carte create nello Studio hanno solo `abilityText` in linguaggio
// naturale (italiano). Questo parser lo legge e ne ricava gli effetti
// reali, così ogni carta creata liberamente funziona davvero in partita.
// Restituisce sempre un oggetto deterministico (nessun uso di random),
// requisito fondamentale per la sincronizzazione del multiplayer LAN.
// ============================================================

const NUMBER_WORDS = {
  un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5,
  sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10
};

function wordToNumber(token) {
  if (token == null) return null;
  const digit = String(token).match(/\d+/);
  if (digit) return parseInt(digit[0], 10);
  const key = String(token).toLowerCase().trim();
  return NUMBER_WORDS[key] ?? null;
}

// Pattern numerico riutilizzabile (cifra o parola)
const NUM = '(\\d+|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)';

// Analizza il testo dell'abilità e restituisce keyword passive + liste di effetti.
export function parseAbility(rawText = '') {
  const t = (rawText || '').toLowerCase();
  const parsed = {
    taunt: false,          // GUARDIANO
    thorns: 0,             // danni a chi la attacca
    divineShield: false,
    turnTriggers: [],      // Effetti passivi di turno (es. fine/inizio turno: hero_burn, spawn_token)
    conditionalCost: null, // Modificatori dinamici di costo (es. se HP <= 50% costo = 5)
    battlecry: [],         // Effetti "quando entra in gioco" / magie istantanee
    deathrattle: []        // Effetti "quando muore"
  };
  if (!t.trim()) return parsed;

  // --- Keyword passive ---
  if (/guardiano|provocazione|\btaunt\b/.test(t)) parsed.taunt = true;
  if (/scudo divino|scudo sacro|immune al primo/.test(t)) parsed.divineShield = true;

  const thornsMatch = t.match(new RegExp(`infligge\\s+${NUM}\\s+danni?\\s+a\\s+chi\\s+l[oae']?\\s*attacca`));
  if (thornsMatch) parsed.thorns = wordToNumber(thornsMatch[1]) || 0;

  // --- Costo condizionale (es. "se hai meno del 50% degli HP il suo costo in mana è 5") ---
  const condCostMatch = t.match(/meno\s+del\s+(\d+)%\s*(?:dei|degli)?\s*(?:hp|punti\s*vita).*?costo.*?(?:è|diventa|=)\s*(\d+)/i);
  if (condCostMatch) {
    parsed.conditionalCost = {
      hpThresholdPercent: parseInt(condCostMatch[1], 10) / 100,
      newCost: parseInt(condCostMatch[2], 10)
    };
  }

  // --- Trigger di Turno (Passivi a ogni turno / a turno / fine turno) ---
  // 1. Danno passivo all'Eroe nemico ad ogni turno (es. "provoca 1/3 danni diretti a turno...")
  const turnBurnMatch = t.match(new RegExp(`(?:provoca|infligge|fa)\\s+${NUM}\\s+danni?\\s+(?:diretti?\\s+)?a\\s+turno`));
  if (turnBurnMatch) {
    parsed.turnTriggers.push({
      type: 'hero_burn',
      value: wordToNumber(turnBurnMatch[1]) || 1
    });
  }

  // 2. Generazione creature ad ogni turno (es. "aggiunge un cliente insoddisfatto sul campo ad ogni turno" o "due clienti...")
  const turnSpawnMatch = t.match(new RegExp(`aggiunge\\s+(?:${NUM}\\s+)?(client[ei]?\\s+insoddisfatt[oiea]|copi[ae]|creatur[ae]|token|servitor[ie]).*?(?:ad\\s+ogni|a|ogni)\\s+turno`));
  if (turnSpawnMatch) {
    const rawNumMatch = t.match(new RegExp(`aggiunge\\s+${NUM}\\s+(?:client|copi|creatur|token|servitor)`));
    const count = rawNumMatch ? (wordToNumber(rawNumMatch[1]) || 1) : 1;
    const tokenStr = turnSpawnMatch[1] || '';
    const tokenType = (tokenStr.includes('client') || t.includes('cliente') || t.includes('insoddisfatt')) ? 'cliente_insoddisfatta' : 'token';
    parsed.turnTriggers.push({
      type: 'spawn_token',
      tokenName: tokenType,
      count: count
    });
  }

  // --- Determinazione del bucket principale (Deathrattle o Battlecry) ---
  const isDeathrattle = /quando\s+muore|alla\s+(sua\s+)?morte|rantolo|quando\s+viene\s+distrutt|esplod/.test(t);
  const bucket = isDeathrattle ? parsed.deathrattle : parsed.battlecry;

  // --- Distruzione diretta di una creatura nemica (es. "distrugge una carta avversaria") ---
  if (/distrugge\s+(?:una\s+)?(?:carta|creatura|servitore)\s+avversari[ao]/i.test(t)) {
    bucket.push({ type: 'destroy_minion', count: 1 });
  }

  // --- Evocazione Token (es. "Evoca Davide Forma 1°" o "Evoca una Cliente insoddisfatta") ---
  if (/evoca\s+davide\s+forma\s+1[°a]?/i.test(t)) {
    bucket.push({ type: 'summon_token', tokenName: 'davide_forma_1', count: 1 });
  } else if (/evoca\s+(?:un[a']?\s+|due\s+)?cliente\s+insoddisfatta/i.test(t)) {
    bucket.push({ type: 'summon_token', tokenName: 'cliente_insoddisfatta', count: 1 });
  }

  // --- Furto risorse / monete / carte (es. "nascondi il portafoglio" o "ruba 1 mana") ---
  if (/nascondi il portafoglio|ruba\s+mana/i.test(t)) {
    bucket.push({ type: 'steal_mana', value: 1 });
  } else if (/ruba\s+(?:1\s+|una\s+)?carta/i.test(t)) {
    bucket.push({ type: 'steal_card', value: 1 });
  }

  // --- Danno all'Eroe nemico esplicito (es. "infligge 5 danni diretti" o "all'eroe") ---
  const heroDmg = t.match(new RegExp(`infligge\\s+${NUM}\\s+danni?\\s+(?:all['\\s]*eroe|diretti?)`));
  if (heroDmg && !turnBurnMatch) {
    bucket.push({ type: 'hero_damage', value: wordToNumber(heroDmg[1]) || 0 });
  }

  // --- Danno ad area a tutti i nemici (creature nemiche) ---
  const aoe = t.match(new RegExp(`infligge\\s+${NUM}\\s+danni?\\s+a\\s+tutt[ie]\\s+(le\\s+creature\\s+nemiche|i\\s+nemici|gli\\s+avversari)`));
  if (aoe) {
    bucket.push({ type: 'aoe_enemy_damage', value: wordToNumber(aoe[1]) || 0 });
  }

  // --- Danno singolo a creatura (non già catturato da eroe/area/spine/turnBurn) ---
  if (!heroDmg && !aoe && !thornsMatch && !turnBurnMatch) {
    const singleDmg = t.match(new RegExp(`infligge\\s+${NUM}\\s+danni`));
    if (singleDmg) {
      bucket.push({ type: 'creature_damage', value: wordToNumber(singleDmg[1]) || 0 });
    }
  }

  // --- Pesca carte ---
  const drawMatch = t.match(new RegExp(`pesc\\w*\\s+(?:${NUM}\\s+)?cart`));
  if (drawMatch) {
    bucket.push({ type: 'draw', value: wordToNumber(drawMatch[1]) || 1 });
  }

  // --- Cura l'Eroe ---
  const healMatch = t.match(new RegExp(`(?:cur\\w*|ripristin\\w*)\\s+(?:il\\s+tuo\\s+eroe\\s+)?(?:di\\s+)?${NUM}\\s+(?:hp|punti\\s+vita|salute|pv)`));
  if (healMatch) {
    bucket.push({ type: 'heal_hero', value: wordToNumber(healMatch[1]) || 0 });
  }

  // --- Aumenta il Mana massimo ---
  const manaMatch = t.match(new RegExp(`mana\\s+massimo\\s+di\\s+${NUM}`));
  if (manaMatch) {
    bucket.push({ type: 'max_mana', value: wordToNumber(manaMatch[1]) || 1 });
  }

  // --- Potenzia le creature alleate (+X/+Y) ---
  const buffMatch = t.match(new RegExp(`(?:potenzia|aumenta|dai?)\\s+(?:le\\s+)?(?:tue\\s+)?creature\\s+(?:alleate\\s+)?di\\s+\\+?${NUM}\\s*\\/\\s*\\+?${NUM}`));
  if (buffMatch) {
    bucket.push({ type: 'buff_board', atk: wordToNumber(buffMatch[1]) || 0, hp: wordToNumber(buffMatch[2]) || 0 });
  }

  return parsed;
}

// Calcola il costo effettivo di mana di una carta in base alle condizioni attuali dell'Eroe
export function getCardEffectiveCost(card, heroState) {
  if (!card) return 0;
  const rawCost = typeof card.cost === 'number' ? card.cost : 0;
  if (!card.abilityText) return rawCost;

  const parsed = parseAbility(card.abilityText);
  if (parsed.conditionalCost && heroState) {
    const thresholdHp = (heroState.maxHp || 30) * parsed.conditionalCost.hpThresholdPercent;
    if (heroState.hp <= thresholdHp) {
      return parsed.conditionalCost.newCost;
    }
  }
  return rawCost;
}

// Applica una lista di effetti battlecry/deathrattle allo stato.
function applyEffects(state, isPlayer, effects) {
  if (!effects || effects.length === 0) return;
  const active = isPlayer ? state.player : state.opponent;
  const enemy = isPlayer ? state.opponent : state.player;

  effects.forEach(effect => {
    switch (effect.type) {
      case 'destroy_minion': {
        if (enemy.board.length > 0) {
          // Priorità a creature con Guardiano, altrimenti la minaccia con stat più alte
          const target = enemy.board.find(m => m.hasTaunt) ||
            [...enemy.board].sort((a, b) => (b.atk + b.currentHp) - (a.atk + a.currentHp))[0];

          if (target) {
            enemy.board = enemy.board.filter(m => m.instanceId !== target.instanceId);
            enemy.graveyard.push(target);
            pushLog(state, `⚡ [${target.name}] di ${enemy.name} è stato distrutto all'istante dall'effetto!`, 'death');
            resolveDeathrattle(state, !isPlayer, target);
          }
        } else {
          pushLog(state, `💨 Nessuna creatura nemica da distruggere sul campo.`, 'info');
        }
        break;
      }
      case 'summon_token': {
        const count = effect.count || 1;
        for (let i = 0; i < count; i++) {
          if (active.board.length < 5) {
            const token = createTokenMinion(effect.tokenName, isPlayer, (state._tokenSeq = (state._tokenSeq || 0) + 1));
            active.board.push(token);
            pushLog(state, `✨ Rinforzo: [${token.name}] (${token.atk}/${token.hp}) entra in campo per ${active.name}!`, 'summon');
          } else {
            pushLog(state, `⚠️ Campo pieno: impossibile evocare altri rinforzi.`, 'warning');
          }
        }
        break;
      }
      case 'steal_mana': {
        if (enemy.mana > 0) {
          const stolen = Math.min(enemy.mana, effect.value || 1);
          enemy.mana -= stolen;
          active.mana = Math.min(active.maxMana, active.mana + stolen);
          pushLog(state, `🪙 ${active.name} ha sottratto ${stolen} Mana all'avversario!`, 'spell');
        }
        break;
      }
      case 'steal_card': {
        if (enemy.hand.length > 0 && active.hand.length < 7) {
          const stolenCard = enemy.hand.pop();
          active.hand.push(stolenCard);
          pushLog(state, `🃏 ${active.name} ha rubato [${stolenCard.name}] dalla mano avversaria!`, 'spell');
        }
        break;
      }
      case 'hero_damage': {
        dealDamageToHero(enemy, effect.value);
        pushLog(state, `💥 L'Eroe di ${enemy.name} subisce ${effect.value} danni diretti!`, 'damage');
        break;
      }
      case 'aoe_enemy_damage': {
        enemy.board.forEach(m => { m.currentHp -= effect.value; });
        pushLog(state, `🔥 Onda d'urto: ${effect.value} danni a tutte le creature di ${enemy.name}!`, 'damage');
        cleanupDeadMinions(state);
        break;
      }
      case 'creature_damage': {
        const target = enemy.board[0];
        if (target) {
          target.currentHp -= effect.value;
          pushLog(state, `💢 [${target.name}] subisce ${effect.value} danni!`, 'damage');
          cleanupDeadMinions(state);
        } else {
          dealDamageToHero(enemy, effect.value);
          pushLog(state, `💥 L'Eroe di ${enemy.name} subisce ${effect.value} danni!`, 'damage');
        }
        break;
      }
      case 'draw': {
        for (let i = 0; i < effect.value; i++) drawCard(active);
        pushLog(state, `🃏 ${active.name} pesca ${effect.value} carta/e.`, 'draw');
        break;
      }
      case 'heal_hero': {
        active.hp = Math.min(active.maxHp, active.hp + effect.value);
        pushLog(state, `💚 ${active.name} recupera ${effect.value} HP.`, 'info');
        break;
      }
      case 'max_mana': {
        active.maxMana = Math.min(10, active.maxMana + effect.value);
        active.mana = Math.min(active.maxMana, active.mana + effect.value);
        pushLog(state, `💎 ${active.name} guadagna ${effect.value} Mana massimo!`, 'info');
        break;
      }
      case 'buff_board': {
        active.board.forEach(m => {
          m.atk += effect.atk;
          m.hp += effect.hp;
          m.currentHp += effect.hp;
        });
        pushLog(state, `⚡ Le creature di ${active.name} ottengono +${effect.atk}/+${effect.hp}!`, 'summon');
        break;
      }
      default:
        break;
    }
  });
}

// Esegue i trigger di inizio/fine turno per le creature presenti sul campo
export function executeTurnTriggers(state, isPlayer) {
  const active = isPlayer ? state.player : state.opponent;
  const enemy = isPlayer ? state.opponent : state.player;

  // Clona la lista delle creature attive per evitare problemi durante le iterazioni
  const minions = [...active.board];

  minions.forEach(minion => {
    // Controlla se ha trigger memorizzati o parsali al volo
    const triggers = (minion.turnTriggers && minion.turnTriggers.length > 0)
      ? minion.turnTriggers
      : parseAbility(minion.abilityText).turnTriggers;

    if (triggers && triggers.length > 0) {
      triggers.forEach(trig => {
        if (trig.type === 'hero_burn') {
          dealDamageToHero(enemy, trig.value);
          pushLog(state, `⚡ [${minion.name}] attiva il potere di turno: ${trig.value} danni diretti a ${enemy.name}!`, 'damage');
        } else if (trig.type === 'spawn_token') {
          const count = trig.count || 1;
          for (let i = 0; i < count; i++) {
            if (active.board.length < 5) {
              const token = createTokenMinion(trig.tokenName, isPlayer, (state._tokenSeq = (state._tokenSeq || 0) + 1));
              active.board.push(token);
              pushLog(state, `🌀 [${minion.name}] genera [${token.name}] (${token.atk}/${token.hp}) sul terreno!`, 'summon');
            }
          }
        }
      });
    }
  });

  cleanupDeadMinions(state);
  checkWinConditions(state);
}

// ---------- Helper di stato ----------

function pushLog(state, text, type = 'info') {
  state.combatLogs.unshift({ id: `log_${state._logSeq = (state._logSeq || 0) + 1}`, text, type });
}

function dealDamageToHero(hero, amount) {
  let dmg = Math.max(0, amount);
  if (hero.shield > 0) {
    if (hero.shield >= dmg) { hero.shield -= dmg; dmg = 0; }
    else { dmg -= hero.shield; hero.shield = 0; }
  }
  hero.hp = Math.max(0, hero.hp - dmg);
}

function drawCard(side) {
  if (side.deck.length > 0 && side.hand.length < 7) {
    side.hand.push(side.deck.shift());
    return true;
  }
  return false;
}

export function createInitialGameState(playerDeckCards, opponentDeckCards, playerHeroName = 'Tu', opponentHeroName = 'Avversario') {
  // Shuffle decks
  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

  const stamp = Date.now();
  const playerDeck = shuffle(playerDeckCards.map((c, idx) => ({ ...c, instanceId: `p_card_${idx}_${stamp}` })));
  const opponentDeck = shuffle(opponentDeckCards.map((c, idx) => ({ ...c, instanceId: `o_card_${idx}_${stamp}` })));

  // Initial draw: 3 cards for Player, 4 cards for Opponent (going second)
  const playerHand = playerDeck.splice(0, 3);
  const opponentHand = opponentDeck.splice(0, 4);

  return {
    turnNumber: 1,
    currentTurn: 'player', // 'player' | 'opponent'
    phase: 'main', // 'draw', 'main', 'combat', 'end'
    _logSeq: 1,
    _tokenSeq: 1,
    player: {
      name: playerHeroName,
      hp: 30,
      maxHp: 30,
      shield: 0,
      mana: 1,
      maxMana: 1,
      deck: playerDeck,
      hand: playerHand,
      board: [],
      graveyard: []
    },
    opponent: {
      name: opponentHeroName,
      hp: 30,
      maxHp: 30,
      shield: 0,
      mana: 1,
      maxMana: 1,
      deck: opponentDeck,
      hand: opponentHand,
      board: [],
      graveyard: []
    },
    combatLogs: [
      { id: 'log_0', text: '🎮 La partita ha inizio! Che vinca il miglior stratega.', type: 'info' }
    ],
    winner: null // null | 'player' | 'opponent' | 'draw'
  };
}

// Play / Summon a card from hand
export function playCard(gameState, isPlayer, cardInstanceId, targetId = null) {
  const state = JSON.parse(JSON.stringify(gameState));
  const active = isPlayer ? state.player : state.opponent;

  const cardIdx = active.hand.findIndex(c => c.instanceId === cardInstanceId);
  if (cardIdx === -1) return state;

  const card = active.hand[cardIdx];
  const effectiveCost = getCardEffectiveCost(card, active);

  // Check Mana
  if (active.mana < effectiveCost) {
    return state;
  }

  // Limite tavola: massimo 5 creature in campo (le magie non occupano il campo)
  if (card.type === 'CREATURA' && active.board.length >= 5) {
    return state;
  }

  // Deduct Mana
  active.mana -= effectiveCost;
  active.hand.splice(cardIdx, 1);

  const abilities = parseAbility(card.abilityText);

  // If Creature: Summon to board
  if (card.type === 'CREATURA') {
    const boardMinion = {
      ...card,
      currentHp: card.hp,
      canAttack: false, // Summoning sickness
      hasTaunt: abilities.taunt,
      thorns: abilities.thorns,
      hasShield: abilities.divineShield,
      turnTriggers: abilities.turnTriggers || [],
      deathrattle: abilities.deathrattle || []
    };

    active.board.push(boardMinion);
    pushLog(state, `${active.name} ha evocato [${card.name}] (${card.atk}/${card.hp})`, 'summon');

    // Battlecry: applica gli effetti "quando entra in gioco"
    applyEffects(state, isPlayer, abilities.battlecry);
  } else {
    // If Spell / Magic: Instant effect
    active.graveyard.push(card);
    pushLog(state, `${active.name} ha lanciato la magia [${card.name}]!`, 'spell');
    applyEffects(state, isPlayer, abilities.battlecry);
  }

  checkWinConditions(state);
  return state;
}

// Attack with Minion
export function attackTarget(gameState, isPlayer, attackerInstanceId, targetType, targetInstanceId = null) {
  const state = JSON.parse(JSON.stringify(gameState));
  const active = isPlayer ? state.player : state.opponent;
  const enemy = isPlayer ? state.opponent : state.player;

  const attacker = active.board.find(m => m.instanceId === attackerInstanceId);
  if (!attacker || !attacker.canAttack) return state;

  // Check Taunts on enemy board
  const enemyTaunts = enemy.board.filter(m => m.hasTaunt);
  if (enemyTaunts.length > 0) {
    if (targetType === 'hero' || (targetInstanceId && !enemyTaunts.some(m => m.instanceId === targetInstanceId))) {
      pushLog(state, `⚠️ Devi attaccare una creatura nemica con GUARDIANO!`, 'warning');
      return state;
    }
  }

  // Regola: non si può colpire direttamente l'Eroe finché ci sono creature nemiche in campo
  if (targetType === 'hero' && enemy.board.length > 0) {
    pushLog(state, `⚠️ Ci sono creature nemiche in campo: devi prima affrontarle!`, 'warning');
    return state;
  }

  attacker.canAttack = false;
  const attackerDmg = Math.max(0, attacker.atk);

  if (targetType === 'hero') {
    // Attack Hero
    dealDamageToHero(enemy, attackerDmg);
    pushLog(state, `⚔️ [${attacker.name}] attacca l'Eroe di ${enemy.name} infliggendo ${attackerDmg} danni!`, 'attack');
  } else if (targetType === 'minion') {
    // Attack Minion (Simultaneous Combat)
    const defender = enemy.board.find(m => m.instanceId === targetInstanceId);
    if (!defender) return state;

    const defenderDmg = Math.max(0, defender.atk);

    // Scudo divino assorbe il primo colpo, altrimenti danno normale
    if (defender.hasShield) {
      defender.hasShield = false;
      pushLog(state, `🛡️ Lo Scudo Divino di [${defender.name}] assorbe il colpo!`, 'info');
    } else {
      defender.currentHp -= attackerDmg;
    }

    if (attacker.hasShield) {
      attacker.hasShield = false;
      pushLog(state, `🛡️ Lo Scudo Divino di [${attacker.name}] assorbe il contrattacco!`, 'info');
    } else {
      attacker.currentHp -= defenderDmg;
      // Spine: la creatura difensiva ferisce chi la attacca
      if (defender.thorns > 0) {
        attacker.currentHp -= defender.thorns;
        pushLog(state, `🌵 [${defender.name}] respinge ${defender.thorns} danni a [${attacker.name}]!`, 'damage');
      }
    }

    pushLog(state, `⚔️ [${attacker.name}] combatte contro [${defender.name}]!`, 'combat');

    // Check Deaths
    if (defender.currentHp <= 0) {
      enemy.board = enemy.board.filter(m => m.instanceId !== defender.instanceId);
      enemy.graveyard.push(defender);
      pushLog(state, `💀 [${defender.name}] di ${enemy.name} è stato distrutto!`, 'death');
      resolveDeathrattle(state, !isPlayer, defender);
    }

    if (attacker.currentHp <= 0) {
      active.board = active.board.filter(m => m.instanceId !== attacker.instanceId);
      active.graveyard.push(attacker);
      pushLog(state, `💀 [${attacker.name}] di ${active.name} è caduto in battaglia!`, 'death');
      resolveDeathrattle(state, isPlayer, attacker);
    }
  }

  checkWinConditions(state);
  return state;
}

// End Turn and Start Next Turn
export function endTurn(gameState) {
  const state = JSON.parse(JSON.stringify(gameState));
  const isNowPlayer = state.currentTurn === 'opponent';
  state.currentTurn = isNowPlayer ? 'player' : 'opponent';

  const active = isNowPlayer ? state.player : state.opponent;

  // Increment Max Mana (up to 10) & Recharge
  if (active.maxMana < 10) {
    active.maxMana += 1;
  }
  active.mana = active.maxMana;

  // Ready all minions to attack
  active.board.forEach(m => {
    m.canAttack = true;
  });

  // Esegui i trigger di inizio turno per le creature attive sul campo (es. Tesseract, Niggastro)
  executeTurnTriggers(state, isNowPlayer);

  // Draw Card from Deck
  if (active.deck.length > 0) {
    if (active.hand.length < 7) {
      const drawnCard = active.deck.shift();
      active.hand.push(drawnCard);
      pushLog(state, `🃏 ${active.name} pesca una carta. (Mazzo: ${active.deck.length})`, 'draw');
    } else {
      const burnedCard = active.deck.shift();
      pushLog(state, `🔥 Mano piena! [${burnedCard.name}] è stata bruciata.`, 'warning');
    }
  } else {
    // Mazzo esaurito: sconfitta immediata (deck-out), niente più danno da fatica.
    active.deckedOut = true;
    pushLog(state, `📕 Mazzo esaurito! ${active.name} non ha più carte da pescare e perde la partita.`, 'death');
  }

  state.turnNumber += 1;
  checkWinConditions(state);
  return state;
}

function resolveDeathrattle(state, isPlayer, minion) {
  // Deathrattle derivato dal testo dell'abilità (già parsato al momento dell'evocazione)
  const effects = minion.deathrattle && minion.deathrattle.length
    ? minion.deathrattle
    : parseAbility(minion.abilityText).deathrattle;

  if (effects && effects.length) {
    pushLog(state, `☠️ Rantolo di morte di [${minion.name}] si attiva!`, 'death');
    applyEffects(state, isPlayer, effects);
    checkWinConditions(state);
  }
}

// Rimuove le creature morte, le sposta nel cimitero, logga e attiva i deathrattle.
function cleanupDeadMinions(state) {
  ['player', 'opponent'].forEach(sideKey => {
    const side = state[sideKey];
    const isPlayerSide = sideKey === 'player';
    const dead = side.board.filter(m => m.currentHp <= 0);
    if (dead.length === 0) return;
    side.board = side.board.filter(m => m.currentHp > 0);
    dead.forEach(m => {
      side.graveyard.push(m);
      pushLog(state, `💀 [${m.name}] di ${side.name} è stato distrutto!`, 'death');
      resolveDeathrattle(state, isPlayerSide, m);
    });
  });
}

function checkWinConditions(state) {
  // Un lato perde se l'Eroe è a 0 HP oppure se ha esaurito il mazzo (deck-out).
  const pOut = state.player.hp <= 0 || state.player.deckedOut;
  const oOut = state.opponent.hp <= 0 || state.opponent.deckedOut;
  if (pOut && oOut) {
    state.winner = 'draw';
  } else if (pOut) {
    state.winner = 'opponent';
  } else if (oOut) {
    state.winner = 'player';
  }
}

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  GOLD: 'pocket_fantasya_player_gold_v1',
  INVENTORY: 'pocket_fantasya_player_inventory_v1',
  CARD_LEVELS: 'pocket_fantasya_card_levels_v1',
};

const DEFAULT_INITIAL_GOLD = 500;
const EVENT_NAME = 'pocket_fantasya_state_change';

function notifyStateChange() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

// ---------------------- ECONOMY (GOLD) ----------------------

export function getStoredGold(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOLD);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_INITIAL_GOLD;
}

export function saveGold(amount: number) {
  try {
    localStorage.setItem(STORAGE_KEYS.GOLD, String(Math.max(0, amount)));
    notifyStateChange();
  } catch (e) {}
}

export function usePlayerEconomy() {
  const [gold, setGoldState] = useState<number>(getStoredGold);

  useEffect(() => {
    const handleUpdate = () => setGoldState(getStoredGold());
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const addGold = useCallback((amount: number) => {
    const current = getStoredGold();
    const next = current + amount;
    saveGold(next);
    return next;
  }, []);

  const spendGold = useCallback((amount: number): boolean => {
    const current = getStoredGold();
    if (current < amount) return false;
    const next = current - amount;
    saveGold(next);
    return true;
  }, []);

  const canAfford = useCallback((amount: number): boolean => {
    return getStoredGold() >= amount;
  }, []);

  return {
    gold,
    addGold,
    spendGold,
    canAfford,
  };
}

// ---------------------- INVENTORY (COLLECTION) ----------------------

export type CardInventory = Record<string, number>; // cardId -> quantity
export type CardLevels = Record<string, number>;   // cardId -> level (1-indexed)

export function getStoredInventory(): CardInventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch (e) {}
  return {};
}

export function saveInventory(inventory: CardInventory) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    notifyStateChange();
  } catch (e) {}
}

// ---------------------- LIVELLI CARTE (CLASH ROYALE STYLE) ----------------------

export function getStoredCardLevels(): CardLevels {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARD_LEVELS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch (e) {}
  return {};
}

export function saveCardLevels(levels: CardLevels) {
  try {
    localStorage.setItem(STORAGE_KEYS.CARD_LEVELS, JSON.stringify(levels));
    notifyStateChange();
  } catch (e) {}
}

// Tabella requisiti copie e costo monete per salire di livello in base alla rarità
export const LEVEL_REQUIREMENTS_BY_RARITY: Record<string, Array<{ copies: number; gold: number }>> = {
  common: [
    { copies: 2, gold: 20 },     // Liv 1 -> 2
    { copies: 4, gold: 50 },     // Liv 2 -> 3
    { copies: 10, gold: 150 },   // Liv 3 -> 4
    { copies: 20, gold: 400 },   // Liv 4 -> 5
    { copies: 50, gold: 1000 },  // Liv 5 -> 6
    { copies: 100, gold: 2000 }, // Liv 6 -> 7
    { copies: 200, gold: 4000 }, // Liv 7 -> 8
    { copies: 400, gold: 8000 }, // Liv 8 -> 9
    { copies: 800, gold: 15000 },// Liv 9 -> 10
  ],
  rare: [
    { copies: 2, gold: 50 },
    { copies: 4, gold: 150 },
    { copies: 10, gold: 400 },
    { copies: 20, gold: 1000 },
    { copies: 40, gold: 2500 },
    { copies: 80, gold: 5000 },
    { copies: 150, gold: 10000 },
    { copies: 300, gold: 20000 },
  ],
  epic: [
    { copies: 1, gold: 100 },
    { copies: 2, gold: 300 },
    { copies: 4, gold: 800 },
    { copies: 10, gold: 2000 },
    { copies: 20, gold: 5000 },
    { copies: 40, gold: 10000 },
    { copies: 80, gold: 20000 },
  ],
  legendary: [
    { copies: 1, gold: 400 },
    { copies: 2, gold: 1000 },
    { copies: 4, gold: 2500 },
    { copies: 8, gold: 6000 },
    { copies: 15, gold: 15000 },
  ],
  mythic: [
    { copies: 1, gold: 800 },
    { copies: 2, gold: 2000 },
    { copies: 4, gold: 5000 },
    { copies: 8, gold: 12000 },
  ],
};

export interface CardLevelInfo {
  level: number;
  ownedTotal: number;
  availableDuplicateCopies: number; // Copie spendibili (oltre alla prima che sblocca la carta)
  requiredCopies: number;
  upgradeCost: number;
  canUpgrade: boolean;
  maxLevelReached: boolean;
  bonusAtk: number;
  bonusHp: number;
  nextBonusAtk: number;
  nextBonusHp: number;
  effectiveAtk: number;
  effectiveHp: number;
  nextEffectiveAtk: number;
  nextEffectiveHp: number;
  progressPercent: number;
}

export function getCardLevel(cardId: string): number {
  if (!cardId) return 1;
  const levels = getStoredCardLevels();
  return levels[cardId] || 1;
}

// Calcola le statistiche e la progressione di livello di una carta
export function getCardLevelInfo(card: any, customInventory?: CardInventory, customGold?: number): CardLevelInfo {
  if (!card || !card.id) {
    return {
      level: 1,
      ownedTotal: 0,
      availableDuplicateCopies: 0,
      requiredCopies: 2,
      upgradeCost: 50,
      canUpgrade: false,
      maxLevelReached: false,
      bonusAtk: 0,
      bonusHp: 0,
      nextBonusAtk: 1,
      nextBonusHp: 1,
      effectiveAtk: 0,
      effectiveHp: 0,
      nextEffectiveAtk: 1,
      nextEffectiveHp: 1,
      progressPercent: 0,
    };
  }

  const levels = getStoredCardLevels();
  const level = levels[card.id] || 1;
  const inv = customInventory || getStoredInventory();
  const currentGold = customGold !== undefined ? customGold : getStoredGold();

  const ownedTotal = inv[card.id] || 0;
  // Le copie disponibili per il potenziamento sono tutte le copie doppie trovate (ownedTotal - 1)
  const availableDuplicateCopies = Math.max(0, ownedTotal - 1);

  const rarity = (card.rarity || 'common').toLowerCase();
  const reqList = LEVEL_REQUIREMENTS_BY_RARITY[rarity] || LEVEL_REQUIREMENTS_BY_RARITY.common;
  const stepIdx = level - 1;

  const isMax = stepIdx >= reqList.length;
  const nextReq = !isMax ? reqList[stepIdx] : null;

  const requiredCopies = nextReq ? nextReq.copies : 0;
  const upgradeCost = nextReq ? nextReq.gold : 0;

  const canUpgrade = !isMax && availableDuplicateCopies >= requiredCopies && currentGold >= upgradeCost;

  // Statistiche base
  const baseAtk = Number(card.atk ?? card.attack ?? 0);
  const baseHp = Number(card.hp ?? card.health ?? 1);

  // Bonus conferiti dal livello (+1 ATK se > 0, +1 HP per ogni livello oltre il primo)
  const bonusAtk = baseAtk > 0 ? (level - 1) : 0;
  const bonusHp = (level - 1);

  const nextBonusAtk = baseAtk > 0 ? level : 0;
  const nextBonusHp = level;

  const effectiveAtk = baseAtk + bonusAtk;
  const effectiveHp = baseHp + bonusHp;
  const nextEffectiveAtk = baseAtk + nextBonusAtk;
  const nextEffectiveHp = baseHp + nextBonusHp;

  const progressPercent = isMax 
    ? 100 
    : requiredCopies > 0 
      ? Math.min(100, Math.round((availableDuplicateCopies / requiredCopies) * 100))
      : 0;

  return {
    level,
    ownedTotal,
    availableDuplicateCopies,
    requiredCopies,
    upgradeCost,
    canUpgrade,
    maxLevelReached: isMax,
    bonusAtk,
    bonusHp,
    nextBonusAtk,
    nextBonusHp,
    effectiveAtk,
    effectiveHp,
    nextEffectiveAtk,
    nextEffectiveHp,
    progressPercent,
  };
}

// Restituisce la carta con statistiche incrementate in base al suo livello memorizzato
export function applyCardLevelStats(card: any, customLevel?: number): any {
  if (!card) return card;
  const lvl = customLevel !== undefined ? customLevel : getCardLevel(card.id);
  const baseAtk = Number(card.atk ?? card.attack ?? 0);
  const baseHp = Number(card.hp ?? card.health ?? 1);

  const bonusAtk = baseAtk > 0 ? (lvl - 1) : 0;
  const bonusHp = (lvl - 1);

  return {
    ...card,
    level: lvl,
    baseAtk,
    baseHp,
    atk: baseAtk + bonusAtk,
    hp: baseHp + bonusHp,
    attack: baseAtk + bonusAtk,
    health: baseHp + bonusHp,
  };
}

// Estrae la chiave base di una carta per raggruppare le sue varianti
export function getBaseCardKey(card: any): string {
  if (!card) return 'unknown';
  if (typeof card.id === 'string' && card.id.includes('__')) {
    return card.id.split('__')[0];
  }
  if (card.baseCardId) return String(card.baseCardId);
  const cleanName = (card.name || '')
    .split('·')[0]
    .trim()
    .toLowerCase();
  return cleanName || card.id;
}

export function getBaseCardName(name: string): string {
  if (!name) return '';
  return name.split('·')[0].trim();
}

// ---------------------- HOOK INVENTARIO & LIVELLI ----------------------

export function usePlayerInventory() {
  const [inventory, setInventoryState] = useState<CardInventory>(getStoredInventory);
  const [cardLevels, setCardLevelsState] = useState<CardLevels>(getStoredCardLevels);

  useEffect(() => {
    const handleUpdate = () => {
      setInventoryState(getStoredInventory());
      setCardLevelsState(getStoredCardLevels());
    };
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Aggiunge una lista di carte appena trovate all'inventario
  const addCardsToInventory = useCallback((cardsToAdd: any[]): { addedCards: any[]; isNewMap: Record<string, boolean> } => {
    const current = getStoredInventory();
    const updated = { ...current };
    const isNewMap: Record<string, boolean> = {};

    cardsToAdd.forEach(c => {
      if (!c || !c.id) return;
      const count = updated[c.id] || 0;
      if (count === 0) {
        isNewMap[c.id] = true;
      }
      updated[c.id] = count + 1;
    });

    saveInventory(updated);
    return { addedCards: cardsToAdd, isNewMap };
  }, []);

  const hasCard = useCallback((cardId: string): boolean => {
    const current = getStoredInventory();
    return (current[cardId] || 0) > 0;
  }, []);

  const getCardQuantity = useCallback((cardId: string): number => {
    const current = getStoredInventory();
    return current[cardId] || 0;
  }, []);

  const getCardLvl = useCallback((cardId: string): number => {
    return cardLevels[cardId] || 1;
  }, [cardLevels]);

  const getLevelInfo = useCallback((card: any): CardLevelInfo => {
    return getCardLevelInfo(card, inventory, getStoredGold());
  }, [inventory]);

  // Esegue l'upgrade di livello stile Clash Royale
  const upgradeCard = useCallback((card: any): { success: boolean; newLevel: number; error?: string } => {
    if (!card || !card.id) return { success: false, newLevel: 1, error: 'Carta non valida' };
    
    const info = getCardLevelInfo(card);
    if (info.maxLevelReached) {
      return { success: false, newLevel: info.level, error: 'Livello massimo già raggiunto!' };
    }
    if (info.availableDuplicateCopies < info.requiredCopies) {
      return { success: false, newLevel: info.level, error: `Ti mancano ${info.requiredCopies - info.availableDuplicateCopies} copie per migliorare questa carta.` };
    }
    const currentGold = getStoredGold();
    if (currentGold < info.upgradeCost) {
      return { success: false, newLevel: info.level, error: `Monete insufficienti! Ti servono ${info.upgradeCost} monete (ne hai ${currentGold}).` };
    }

    // 1. Spendi monete
    saveGold(currentGold - info.upgradeCost);

    // 2. Consuma le copie doppie richieste (mantenendo sempre la carta sbloccata con almeno 1 copia)
    const currentInv = getStoredInventory();
    const currentCount = currentInv[card.id] || 1;
    const newCount = Math.max(1, currentCount - info.requiredCopies);
    const updatedInv = { ...currentInv, [card.id]: newCount };
    saveInventory(updatedInv);

    // 3. Aumenta il livello della carta
    const currentLevels = getStoredCardLevels();
    const newLevel = (currentLevels[card.id] || 1) + 1;
    const updatedLevels = { ...currentLevels, [card.id]: newLevel };
    saveCardLevels(updatedLevels);

    return { success: true, newLevel };
  }, []);

  return {
    inventory,
    cardLevels,
    addCardsToInventory,
    hasCard,
    getCardQuantity,
    getCardLvl,
    getLevelInfo,
    upgradeCard,
  };
}

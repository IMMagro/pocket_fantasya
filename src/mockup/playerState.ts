import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  GOLD: 'pocket_fantasya_player_gold_v1',
  INVENTORY: 'pocket_fantasya_player_inventory_v1',
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

// Estrae la chiave base di una carta per raggruppare le sue varianti
export function getBaseCardKey(card: any): string {
  if (!card) return 'unknown';
  // 1. Se l'ID contiene il delimitatore '__', la radice è la prima parte (es. card_1786147950550__full_art -> card_1786147950550)
  if (typeof card.id === 'string' && card.id.includes('__')) {
    return card.id.split('__')[0];
  }
  // 2. Se ha baseCardId esplicito
  if (card.baseCardId) return String(card.baseCardId);
  // 3. Altrimenti usa il nome ripulito da suffissi di variante
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

export function usePlayerInventory() {
  const [inventory, setInventoryState] = useState<CardInventory>(getStoredInventory);

  useEffect(() => {
    const handleUpdate = () => setInventoryState(getStoredInventory());
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

  return {
    inventory,
    addCardsToInventory,
    hasCard,
    getCardQuantity,
  };
}

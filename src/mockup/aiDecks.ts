// Mazzo AI predefinito dell'espansione.
// L'avversario non pesca più a caso da TUTTO il catalogo: usa un mazzo curato e
// deterministico costruito dalle carte base dell'espansione, con copie sensate per
// rarità. Pronto per le missioni (che potranno passare recipe/espansioni diverse).
import { getBaseCardKey } from './playerState'

const copiesForRarity = (r: string): number => {
  if (r === 'legendary' || r === 'mythic') return 1
  if (r === 'epic') return 1
  return 2
}

// Costruisce il mazzo AI dal catalogo pubblicato.
// - filtra all'espansione richiesta (default: gli_elettronici)
// - una sola variante per carta base (preferisce la finitura più bassa/standard)
// - aggiunge copie in base alla rarità
export function buildAiDeck(allCards: any[], opts: { expansion?: string; maxSize?: number } = {}): any[] {
  const expansion = opts.expansion || 'gli_elettronici'
  const maxSize = opts.maxSize || 30

  const byBase: Record<string, any> = {}
  for (const c of allCards || []) {
    if (!c) continue
    if (c.set && expansion && c.set !== expansion) continue
    const key = getBaseCardKey(c)
    const cur = byBase[key]
    const level = c.variantLevel || 0
    if (!cur || level < (cur.variantLevel || 0)) byBase[key] = c
  }

  const bases = Object.values(byBase).sort((a: any, b: any) => (a.cost || 0) - (b.cost || 0))
  if (bases.length === 0) return (allCards || []).slice() // fallback: catalogo intero

  let deck: any[] = []
  for (const base of bases) {
    const n = copiesForRarity(String(base.rarity || 'common'))
    for (let k = 0; k < n && deck.length < maxSize; k++) deck.push(base)
  }

  // PAD DECK: se il catalogo ha poche carte (es. in fase di test), replichiamo per
  // avere un mazzo decente (almeno 20 carte) ed evitare sconfitte per fatica.
  if (deck.length > 0 && deck.length < 20) {
    const original = [...deck];
    while (deck.length < 20) {
      deck = deck.concat(original);
    }
    // tronchiamo a maxSize se la concatenazione sfora (raro se maxSize è 30 e noi arriviamo a 20)
    deck = deck.slice(0, Math.max(20, maxSize));
  }

  return deck
}

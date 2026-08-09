/**
 * CARD BALANCE ENGINE - Pocket Fantasya TCG
 * Algoritmo di analisi e bilanciamento matematico basato sul Vanilla Test e Mana Curve standard TCG.
 */

export interface DetectedEffect {
  id: string
  label: string
  points: number
  description: string
  icon: string
}

export interface CardBalanceReport {
  powerScore: number
  targetBudget: number
  balanceRatio: number // Percentuale (100% = bilanciamento perfetto)
  status: 'underpowered' | 'balanced' | 'strong' | 'overpowered'
  statusLabel: string
  statusColor: string
  statusIcon: string
  
  statPoints: number
  effectsPoints: number
  rarityBonus: number
  
  detectedEffects: DetectedEffect[]
  suggestedCost: number
  suggestedAtk: number
  suggestedHp: number
  advice: string[]
}

const RARITY_PREMIUM: Record<string, number> = {
  common: 0,
  rare: 0.5,
  epic: 1.0,
  legendary: 1.5,
  mythic: 2.0
}

/**
 * Analizza il testo dell'abilità per estrarre effetti e quantificarne il valore in punti potere.
 */
export function extractEffectsFromText(text: string, title: string = ''): DetectedEffect[] {
  const combined = `${title} ${text}`.toLowerCase()
  const effects: DetectedEffect[] = []

  if (!combined.trim()) return effects

  // 1. Danno Diretto / Sparo (es. "infligge 3 danni", "provoca 1 danni", "4 danni all'avversario")
  const damageMatch = combined.match(/(?:infligge|provoca|fai|fa|deal)\s+(\d+)\s*(?:danni|danno)/i) ||
                      combined.match(/(\d+)\s*(?:danni|danno)\s*(?:diretti|all'eroe|all'avversario|a tutti)/i)
  if (damageMatch) {
    const dmg = parseInt(damageMatch[1], 10)
    const isAoE = combined.includes('a tutti') || combined.includes('ogni nemico')
    const pts = isAoE ? dmg * 3.5 : dmg * 2.0
    effects.push({
      id: 'damage',
      label: isAoE ? `Danno ad Area (${dmg} Danni)` : `Danno Diretto (${dmg} Danni)`,
      points: pts,
      description: isAoE ? `Infligge danno a più bersagli (+${pts} pt)` : `Impatto immediato sul campo o eroe (+${pts} pt)`,
      icon: '⚔️'
    })
  } else if (combined.includes('danni diretti') || combined.includes('danni a turno')) {
    effects.push({
      id: 'damage_dot',
      label: 'Danno Continuo / Passivo',
      points: 2.5,
      description: 'Pressione costante sul nemico ogni turno (+2.5 pt)',
      icon: '🔥'
    })
  }

  // 2. Distruzione / Hard Removal (es. "distrugge una carta", "distrugge un servitore")
  if (combined.includes('distrugge') || combined.includes('distruggi') || combined.includes('elimina')) {
    effects.push({
      id: 'removal',
      label: 'Distruzione Bersaglio (Hard Removal)',
      points: 6.5,
      description: 'Eliminazione incondizionata di una minaccia (+6.5 pt)',
      icon: '💥'
    })
  }

  // 3. Cura Eroe / Ripristino Vita (es. "cura il tuo eroe di 4 hp", "ripristina 3 hp", "guarisce 1 hp")
  const healMatch = combined.match(/(?:cura|guarisce|ripristina|recupera)(?:\s+il\s+tuo\s+eroe)?(?:\s+di)?\s+(\d+)\s*(?:hp|vita|punti vita)?/i) ||
                    combined.match(/(\d+)\s*(?:hp|vita)\s*(?:al tuo eroe|ripristinati|curati)/i)
  if (healMatch) {
    const heal = parseInt(healMatch[1], 10)
    const pts = heal * 1.0
    effects.push({
      id: 'heal',
      label: `Cura / Ripristino (${heal} HP)`,
      points: pts,
      description: `Prolunga la sopravvivenza del tuo eroe (+${pts} pt)`,
      icon: '💚'
    })
  }

  // 4. Pesca Carte / Card Advantage (es. "pesca 1 carta", "pesca 2 carte", "ruba 1 carta")
  const drawMatch = combined.match(/(?:pesca|ruba|ottieni)\s+(\d+)\s*(?:carte|carta)/i)
  if (drawMatch) {
    const drawCount = parseInt(drawMatch[1], 10)
    const pts = drawCount * 2.5
    effects.push({
      id: 'draw',
      label: `Pesca Carte (+${drawCount} carte)`,
      points: pts,
      description: `Genera vantaggio carte nella tua mano (+${pts} pt)`,
      icon: '🃏'
    })
  } else if (combined.includes('pesca') || combined.includes('ruba 1 carta')) {
    effects.push({
      id: 'draw',
      label: 'Pesca Carte',
      points: 2.5,
      description: 'Genera vantaggio carte (+2.5 pt)',
      icon: '🃏'
    })
  }

  // 5. Evocazione Minion / Token Spawn (es. "evoca davide", "aggiunge un cliente insoddisfatto", "schiera bot")
  if (combined.includes('evoca') || combined.includes('aggiunge un') || combined.includes('schiera') || combined.includes('genera un')) {
    effects.push({
      id: 'spawn',
      label: 'Evocazione Unità Aggiuntiva (Token/Spawn)',
      points: 4.0,
      description: 'Crea presenza extra sulla scacchiera di gioco (+4.0 pt)',
      icon: '👥'
    })
  }

  // 6. Provocazione / Guardiano (Taunt)
  if (combined.includes('provocazione') || combined.includes('guardiano') || combined.includes('devono attaccare')) {
    effects.push({
      id: 'taunt',
      label: 'Provocazione / Guardiano',
      points: 1.5,
      description: 'Costringe i nemici ad attaccare questa creatura (+1.5 pt)',
      icon: '🛡️'
    })
  }

  // 7. Stordimento / Congelamento (Stun / Freeze)
  if (combined.includes('stordisce') || combined.includes('stordito') || combined.includes('congela') || combined.includes('congelato')) {
    effects.push({
      id: 'stun',
      label: 'Stordimento / Congelamento',
      points: 2.0,
      description: 'Inabilita un nemico per 1 turno intero (+2.0 pt)',
      icon: '❄️'
    })
  }

  // 8. Furtività / Portata / Volo (Evasion & Direct Attack)
  if (combined.includes('furtività') || combined.includes('portata') || combined.includes('vola') || combined.includes('senza essere bloccato') || combined.includes('attaccare direttamente')) {
    effects.push({
      id: 'evasion',
      label: 'Furtività / Attacco Diretto',
      points: 2.0,
      description: 'Bypassa le difese nemiche e colpisce con precisione (+2.0 pt)',
      icon: '🏹'
    })
  }

  // 9. Rinascita / Ritorno in Vita (Deathrattle Rebirth)
  if (combined.includes('ritorna in campo') || combined.includes('rinasce') || combined.includes('quando muore')) {
    effects.push({
      id: 'rebirth',
      label: 'Rinascita / Resurrezione',
      points: 4.5,
      description: 'Resiste all\'eliminazione ritornando in battaglia (+4.5 pt)',
      icon: '✨'
    })
  }

  // 10. Sconto Mana Condizionale (es. "costo in mana è 5", "riduce il suo costo")
  if (combined.includes('costo in mana è') || combined.includes('riduce il costo') || combined.includes('mana extra')) {
    effects.push({
      id: 'mana_cheat',
      label: 'Accelerazione / Sconto Mana',
      points: 3.0,
      description: 'Permette giocate anticipate a ritmo elevato (+3.0 pt)',
      icon: '⚡'
    })
  }

  return effects
}

/**
 * Legge direttamente gli effetti strutturati (Phase D) per un calcolo deterministico e perfetto.
 */
export function extractEffectsFromFlags(flags: any): DetectedEffect[] {
  const effects: DetectedEffect[] = []
  if (!flags) return effects;

  // Passivi
  if (flags.taunt) {
    effects.push({ id: 'taunt', label: 'Provocazione / Guardiano', points: 1.5, description: 'Difende gli alleati (+1.5 pt)', icon: '🛡️' })
  }
  if (flags.divineShield) {
    effects.push({ id: 'shield', label: 'Scudo Divino', points: 1.5, description: 'Ignora i primi danni subiti (+1.5 pt)', icon: '✨' })
  }
  if (flags.thorns && flags.thorns > 0) {
    const pts = flags.thorns * 1.5;
    effects.push({ id: 'thorns', label: `Spine (${flags.thorns})`, points: pts, description: `Danno da contrattacco (+${pts} pt)`, icon: '🗡️' })
  }
  if (flags.conditionalCost) {
    effects.push({ id: 'conditional_cost', label: 'Sconto Mana Condizionale', points: 2.0, description: 'Potenziale costo ridotto (+2.0 pt)', icon: '⚡' })
  }

  // Battlecry
  if (flags.battlecry && Array.isArray(flags.battlecry)) {
    flags.battlecry.forEach((bc: any) => {
      const val = bc.value || bc.count || 1;
      if (bc.type === 'damage') effects.push({ id: 'damage', label: `Danno Diretto (${val})`, points: val * 2.0, description: `(+${val * 2.0} pt)`, icon: '⚔️' })
      if (bc.type === 'heal') effects.push({ id: 'heal', label: `Cura (${val})`, points: val * 1.5, description: `(+${val * 1.5} pt)`, icon: '💖' })
      if (bc.type === 'draw') effects.push({ id: 'draw', label: `Pesca (${val})`, points: val * 2.5, description: `(+${val * 2.5} pt)`, icon: '🃏' })
      if (bc.type === 'steal_mana') effects.push({ id: 'steal_mana', label: `Ruba Mana (${val})`, points: val * 3.0, description: `(+${val * 3.0} pt)`, icon: '💰' })
      if (bc.type === 'steal_card') effects.push({ id: 'steal_card', label: `Ruba Carta (${val})`, points: val * 3.5, description: `(+${val * 3.5} pt)`, icon: '🕵️' })
      if (bc.type === 'destroy_minion') effects.push({ id: 'removal', label: `Distruggi Nemico (${val})`, points: val * 6.5, description: `(+${val * 6.5} pt)`, icon: '💥' })
      if (bc.type === 'summon_token') effects.push({ id: 'spawn', label: `Evoca Token (${val})`, points: val * 4.0, description: `(+${val * 4.0} pt)`, icon: '👥' })
    })
  }

  // Turn Triggers
  if (flags.turnTriggers && Array.isArray(flags.turnTriggers)) {
    flags.turnTriggers.forEach((tt: any) => {
      const val = tt.value || tt.count || 1;
      if (tt.type === 'hero_burn') effects.push({ id: 'damage_dot', label: `Danno Continuo (${val}/turno)`, points: val * 2.5, description: `(+${val * 2.5} pt)`, icon: '🔥' })
      if (tt.type === 'spawn_token') effects.push({ id: 'spawn_dot', label: `Generatore (${val}/turno)`, points: val * 5.0, description: `(+${val * 5.0} pt)`, icon: '🌀' })
    })
  }

  return effects
}

/**
 * Calcola il Budget di Punti Mana per una carta.
 * Formula Vanilla Test standard: Costo * 2 + 1 (con curve premiate per costi alti).
 */
export function getTargetBudget(cost: number, type: string = 'CREATURA'): number {
  const c = Math.max(0, cost)
  if (type === 'INCANTESIMO' || type === 'MAGIA') {
    return Math.max(2, c * 2 + 1)
  }
  // Creature: 0 mana -> 2, 1 mana -> 3, 2 mana -> 5, 3 mana -> 7, 4 mana -> 9, 5 mana -> 11, 6 mana -> 13, 7 mana -> 15...
  return Math.max(2, c * 2 + 1)
}

/**
 * Analizza completamente il bilanciamento di una carta.
 */
export function analyzeCardBalance(card: {
  cost?: number | string
  atk?: number | string
  hp?: number | string
  type?: string
  rarity?: string
  abilityTitle?: string
  abilityText?: string
  effects?: any
}): CardBalanceReport {
  const cost = Math.max(0, parseInt(String(card.cost ?? 0), 10) || 0)
  const atk = Math.max(0, parseInt(String(card.atk ?? 0), 10) || 0)
  const hp = Math.max(0, parseInt(String(card.hp ?? 0), 10) || 0)
  const type = String(card.type || 'CREATURA').toUpperCase()
  const rarity = String(card.rarity || 'common').toLowerCase()

  // Prioritize structured effects (Phase D) if available, otherwise fallback to NLP
  const detectedEffects = (card.effects && Object.keys(card.effects).length > 0)
    ? extractEffectsFromFlags(card.effects)
    : extractEffectsFromText(card.abilityText || '', card.abilityTitle || '')
  
  
  const statPoints = (type === 'INCANTESIMO' || type === 'MAGIA' || type === 'TRAPPOLA') ? 0 : (atk + hp)
  const effectsPoints = detectedEffects.reduce((sum, e) => sum + e.points, 0)
  const rarityBonus = RARITY_PREMIUM[rarity] ?? 0

  const targetBudget = getTargetBudget(cost, type)
  const powerScore = Number(Math.max(1, statPoints + effectsPoints - rarityBonus).toFixed(1))
  
  const balanceRatio = Math.round((powerScore / targetBudget) * 100)

  let status: CardBalanceReport['status'] = 'balanced'
  let statusLabel = 'Perfettamente Bilanciata'
  let statusColor = '#10b981' // emerald-500
  let statusIcon = '⚖️'

  if (balanceRatio < 80) {
    status = 'underpowered'
    statusLabel = 'Sottodimensionata (Debole)'
    statusColor = '#38bdf8' // sky-400
    statusIcon = '📉'
  } else if (balanceRatio <= 115) {
    status = 'balanced'
    statusLabel = 'Perfettamente Bilanciata'
    statusColor = '#10b981' // emerald-500
    statusIcon = '⚖️'
  } else if (balanceRatio <= 135) {
    status = 'strong'
    statusLabel = 'Forte / Sopra la Media'
    statusColor = '#f59e0b' // amber-500
    statusIcon = '⚠️'
  } else {
    status = 'overpowered'
    statusLabel = 'Sovrapotenziata (OP)'
    statusColor = '#ef4444' // red-500
    statusIcon = '🔥'
  }

  // Calcolo Costo Suggerito per le statistiche/effetti attuali
  const requiredBudget = statPoints + effectsPoints - rarityBonus
  const rawSuggestedCost = Math.round((requiredBudget - 1) / 2)
  const suggestedCost = Math.max(0, Math.min(10, rawSuggestedCost))

  // Calcolo Statistiche Suggerite (ATK / HP) per il costo e gli effetti correnti
  const availableStatBudget = Math.max(2, targetBudget + rarityBonus - effectsPoints)
  
  let suggestedAtk = atk
  let suggestedHp = hp

  if (type !== 'INCANTESIMO' && type !== 'MAGIA' && type !== 'TRAPPOLA') {
    const currentTotal = atk + hp
    if (currentTotal > 0) {
      const atkRatio = atk / currentTotal
      suggestedAtk = Math.max(0, Math.round(availableStatBudget * atkRatio))
      suggestedHp = Math.max(1, Math.round(availableStatBudget - suggestedAtk))
      if (suggestedHp < 1) {
        suggestedHp = 1
        suggestedAtk = Math.max(0, availableStatBudget - 1)
      }
    } else {
      // Default standard curve distribution
      suggestedAtk = Math.max(1, Math.floor(availableStatBudget / 2))
      suggestedHp = Math.max(1, Math.ceil(availableStatBudget / 2))
    }
  }

  // Generazione consigli formativi e didattici
  const advice: string[] = []
  if (status === 'underpowered') {
    const diff = targetBudget - powerScore
    advice.push(`Offre poche statistiche o effetti rispetto al suo costo di ${cost} Mana (mancano circa ${diff.toFixed(0)} punti potere).`)
    if (suggestedCost < cost) {
      advice.push(`Puoi ridurre il costo a ${suggestedCost} Mana oppure aumentare le statistiche a ${suggestedAtk} ATK / ${suggestedHp} HP.`)
    } else {
      advice.push(`Puoi aumentare le statistiche a ${suggestedAtk} ATK / ${suggestedHp} HP per renderla competitiva.`)
    }
  } else if (status === 'balanced') {
    advice.push(`Le statistiche (${atk}/${hp}) e gli effetti speciali sono ideali per una carta da ${cost} Mana di grado ${rarity.toUpperCase()}.`)
    advice.push('Questa carta offre un gameplay leale, divertente e competitivo.')
  } else if (status === 'strong') {
    advice.push(`È leggermente più forte dello standard (rapporto ${balanceRatio}%). Ottima come carta di punta per archetipi dedicati.`)
    advice.push(`Se vuoi renderla puramente neutra, porta il costo a ${suggestedCost} Mana o le statistiche a ${suggestedAtk}/${suggestedHp}.`)
  } else {
    advice.push(`Troppo forte per ${cost} Mana! Rischierebbe di dominare il gioco e rendere obsolete le altre carte.`)
    advice.push(`Consiglio: aumenta il costo a ${suggestedCost} Mana o riduci le statistiche a ${suggestedAtk} ATK / ${suggestedHp} HP.`)
  }

  return {
    powerScore,
    targetBudget,
    balanceRatio,
    status,
    statusLabel,
    statusColor,
    statusIcon,
    statPoints,
    effectsPoints,
    rarityBonus,
    detectedEffects,
    suggestedCost,
    suggestedAtk,
    suggestedHp,
    advice
  }
}

/**
 * Suggerisce le statistiche ideali (ATK / HP) mantenendo inalterato il costo e gli effetti.
 */
export function suggestOptimalStats(card: {
  cost?: number | string
  atk?: number | string
  hp?: number | string
  type?: string
  rarity?: string
  abilityTitle?: string
  abilityText?: string
}): { atk: number; hp: number } {
  const rep = analyzeCardBalance(card)
  return { atk: rep.suggestedAtk, hp: rep.suggestedHp }
}

/**
 * Suggerisce il costo in Mana ideale per mantenere inalterate le statistiche e gli effetti.
 */
export function suggestOptimalCost(card: {
  cost?: number | string
  atk?: number | string
  hp?: number | string
  type?: string
  rarity?: string
  abilityTitle?: string
  abilityText?: string
}): number {
  const rep = analyzeCardBalance(card)
  return rep.suggestedCost
}

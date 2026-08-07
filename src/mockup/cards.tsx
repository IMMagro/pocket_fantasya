import { TactileCard } from '../components/card/TactileCard'
import type { Card } from './NewUI'

// ── Full-size card component (for reveal / detail screens) ────────────────────
export function BigCard({ card }: { card: Card }) {
  const tactileCardData = {
    id: card.id,
    name: card.name,
    cost: card.cost,
    type: card.type,
    atk: card.atk,
    hp: card.hp,
    rarity: card.rarity === 'leggendaria' ? 'legendary' : card.rarity === 'rara' ? 'rare' : card.rarity === 'epica' ? 'epic' : 'common',
    abilityTitle: card.element ? card.element.toUpperCase() : 'ABILITÀ',
    abilityText: card.ability,
    flavorText: card.lore,
    imageUrl: card.imageUrl
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <TactileCard card={tactileCardData} size="lg" interactive={true} />
    </div>
  )
}

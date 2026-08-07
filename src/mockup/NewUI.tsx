import { useState, useEffect, useMemo, useRef, type SVGProps, type FC } from 'react'

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  sword: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2.5L21 9l-11 11-7-1-1-7L14.5 2.5z"/>
      <line x1="2" y1="22" x2="8" y2="16"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  shield: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  trophy: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v8a6 6 0 01-12 0V4z"/>
      <path d="M9 22v-3M15 22v-3M9 22h6"/>
      <line x1="6" y1="19" x2="18" y2="19"/>
    </svg>
  ),
  book: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  bot: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M12 2v4M8 15h.01M16 15h.01"/>
      <path d="M8 11V8a4 4 0 018 0v3"/>
      <line x1="12" y1="6" x2="12" y2="6"/>
    </svg>
  ),
  package: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  collection: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="7" width="14" height="16" rx="2"/>
      <path d="M8 7V5a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2h-2"/>
    </svg>
  ),
  cards: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 2h-4a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-6-6z"/>
      <polyline points="13 2 13 8 19 8"/>
      <path d="M12 12l-2 4h4l-2-4z"/>
    </svg>
  ),
  home: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  star: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  fire: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z"/>
      <path d="M12 12c0 3-2 4-2 6a2 2 0 004 0c0-2-2-3-2-6z"/>
    </svg>
  ),
  dragon: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3C8 3 4 6 4 10c0 2 1 4 3 5l-3 6h5l2-3 2 3h5l-3-6c2-1 3-3 3-5 0-4-4-7-6-7z"/>
      <path d="M9 10h.01M15 10h.01"/>
      <path d="M7 7l-2-3M17 7l2-3"/>
    </svg>
  ),
  wizard: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L8 10H2l5.5 4-2 7L12 17l6.5 4-2-7L22 10h-6L12 2z"/>
    </svg>
  ),
  gem: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
      <line x1="12" y1="22" x2="12" y2="2"/>
      <polyline points="2 8.5 12 13 22 8.5"/>
    </svg>
  ),
  leaf: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34 3.4 20 3.8 21 4.5 21 9 21 15 19 17 8z"/>
      <path d="M17 8l-1 13"/>
    </svg>
  ),
  zap: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  droplet: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
    </svg>
  ),
  skull: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a9 9 0 00-9 9c0 3.18 1.66 5.97 4.17 7.6L7 21h10l-.17-2.4A9 9 0 0021 11a9 9 0 00-9-9z"/>
      <line x1="9" y1="15" x2="9.01" y2="15"/>
      <line x1="15" y1="15" x2="15.01" y2="15"/>
    </svg>
  ),
  mountain: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 20 9 4 15 14 18 10 21 20 3 20"/>
    </svg>
  ),
  cross: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  trash: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  search: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  check: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  chevronDown: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  layers: (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
}

// ── Card data ─────────────────────────────────────────────────────────────────
type Rarity = 'leggendaria' | 'rara' | 'non comune' | 'comune'
type CardType = 'Creatura' | 'Incantesimo' | 'Artefatto' | 'Trappola'
type Element = 'fuoco' | 'acqua' | 'natura' | 'oscurità' | 'luce' | 'fulmine' | 'terra'

interface Card {
  id: string
  name: string
  cost: number
  atk: number
  hp: number
  type: CardType
  element: Element
  rarity: Rarity
  ability: string
}

const CATALOG: Card[] = [
  { id:'c1',  name:'Drago Infuocato',      cost:7, atk:12, hp:8,  type:'Creatura',    element:'fuoco',    rarity:'leggendaria',  ability:'Vola. Quando attacca, infligge 3 danni all\'avversario.' },
  { id:'c2',  name:'Arciere Elfico',        cost:2, atk:3,  hp:2,  type:'Creatura',    element:'natura',   rarity:'comune',       ability:'Portata. Può attaccare direttamente.' },
  { id:'c3',  name:'Golem di Pietra',       cost:5, atk:4,  hp:10, type:'Creatura',    element:'terra',    rarity:'rara',         ability:'Provocazione. Riduce il danno ricevuto di 2.' },
  { id:'c4',  name:'Maga Oscura',           cost:4, atk:6,  hp:4,  type:'Creatura',    element:'oscurità', rarity:'rara',         ability:'Quando viene evocata, ruba 1 carta all\'avversario.' },
  { id:'c5',  name:'Palla di Fuoco',        cost:3, atk:0,  hp:0,  type:'Incantesimo', element:'fuoco',    rarity:'comune',       ability:'Infligge 6 danni a un bersaglio a scelta.' },
  { id:'c6',  name:'Guaritore della Luce',  cost:3, atk:2,  hp:3,  type:'Creatura',    element:'luce',     rarity:'non comune',   ability:'Curata: Ripristina 4 HP al tuo eroe.' },
  { id:'c7',  name:'Tempesta di Fulmini',   cost:6, atk:0,  hp:0,  type:'Incantesimo', element:'fulmine',  rarity:'rara',         ability:'Infligge 4 danni a tutti i nemici sul campo.' },
  { id:'c8',  name:'Spirito Marino',        cost:2, atk:2,  hp:3,  type:'Creatura',    element:'acqua',    rarity:'comune',       ability:'Pesca 1 carta aggiuntiva quando entra in campo.' },
  { id:'c9',  name:'Guardiano Eterno',      cost:8, atk:8,  hp:12, type:'Creatura',    element:'luce',     rarity:'leggendaria',  ability:'Immune agli incantesimi. Cura 3 HP a turno.' },
  { id:'c10', name:'Trappola Velenosa',     cost:1, atk:0,  hp:0,  type:'Trappola',    element:'natura',   rarity:'comune',       ability:'Avvelena un nemico: perde 2 HP per turno per 3 turni.' },
  { id:'c11', name:'Fenice Rinata',         cost:5, atk:5,  hp:5,  type:'Creatura',    element:'fuoco',    rarity:'rara',         ability:'Quando muore, ritorna in campo con 3 HP.' },
  { id:'c12', name:'Ombra Assassina',       cost:3, atk:5,  hp:2,  type:'Creatura',    element:'oscurità', rarity:'non comune',   ability:'Furtività. Può attaccare senza essere bloccato.' },
  { id:'c13', name:'Cristallo di Mana',     cost:0, atk:0,  hp:0,  type:'Artefatto',   element:'luce',     rarity:'non comune',   ability:'Aggiungi 1 Mana extra per i prossimi 2 turni.' },
  { id:'c14', name:'Titano del Tuono',      cost:6, atk:7,  hp:6,  type:'Creatura',    element:'fulmine',  rarity:'rara',         ability:'Stordisce un nemico per 1 turno quando attacca.' },
  { id:'c15', name:'Ninfa della Foresta',   cost:1, atk:1,  hp:2,  type:'Creatura',    element:'natura',   rarity:'comune',       ability:'Guarisce 1 HP alla tua creatura più indebolita.' },
  { id:'c16', name:'Invocazione Oscura',    cost:4, atk:0,  hp:0,  type:'Incantesimo', element:'oscurità', rarity:'non comune',   ability:'Riporta in campo una creatura dal cimitero.' },
  { id:'c17', name:'Colosso di Granito',    cost:9, atk:10, hp:15, type:'Creatura',    element:'terra',    rarity:'leggendaria',  ability:'Provocazione. Quando entra, distrugge un artefatto nemico.' },
  { id:'c18', name:'Raggio Polare',         cost:2, atk:0,  hp:0,  type:'Incantesimo', element:'acqua',    rarity:'comune',       ability:'Congela un nemico per 1 turno.' },
]

const ELEMENT_META: Record<Element, { color: string; glow: string; bg: string; Icon: FC<SVGProps<SVGSVGElement>> }> = {
  fuoco:     { color:'#f87171', glow:'rgba(248,113,113,0.5)', bg:'linear-gradient(160deg,#2e0800,#4a1200)', Icon: Icon.fire },
  acqua:     { color:'#60a5fa', glow:'rgba(96,165,250,0.5)',  bg:'linear-gradient(160deg,#00152e,#00264a)', Icon: Icon.droplet },
  natura:    { color:'#4ade80', glow:'rgba(74,222,128,0.5)',  bg:'linear-gradient(160deg,#052e00,#0a4a00)', Icon: Icon.leaf },
  oscurità:  { color:'#c084fc', glow:'rgba(192,132,252,0.5)', bg:'linear-gradient(160deg,#1a0030,#2d0050)', Icon: Icon.skull },
  luce:      { color:'#fde68a', glow:'rgba(253,230,138,0.5)', bg:'linear-gradient(160deg,#2e2800,#4a4000)', Icon: Icon.star },
  fulmine:   { color:'#facc15', glow:'rgba(250,204,21,0.5)',  bg:'linear-gradient(160deg,#2e2000,#503800)', Icon: Icon.zap },
  terra:     { color:'#a78bfa', glow:'rgba(167,139,250,0.4)', bg:'linear-gradient(160deg,#1a1030,#2a1a4a)', Icon: Icon.mountain },
}

const RARITY_META: Record<Rarity, { color: string; label: string; border: string }> = {
  leggendaria:  { color:'#ffd700', label:'★ LEGGENDARIA', border:'rgba(255,215,0,0.6)' },
  rara:         { color:'#a78bfa', label:'◆ RARA',        border:'rgba(167,139,250,0.5)' },
  'non comune': { color:'#60a5fa', label:'● NON COMUNE',  border:'rgba(96,165,250,0.4)' },
  comune:       { color:'#9ca3af', label:'· COMUNE',      border:'rgba(156,163,175,0.3)' },
}

export { CATALOG, ELEMENT_META, RARITY_META, Icon }
export type { Card, Rarity, CardType, Element }

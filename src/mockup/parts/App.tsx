import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../NewUI'
import { PackOpening } from './PackOpening'
import { RealArena } from './RealArena'
import { RealDeckBuilder } from './RealDeckBuilder'
import { RealCollection } from './RealCollection'
import { useRealCards, rarInfo, REAL_RARITY } from '../realCards'

// Ordine di rarità (alto → basso) per scegliere la carta più prestigiosa
const RARITY_RANK: Record<string, number> = { mythic: 4, legendary: 3, epic: 2, rare: 1, common: 0 }

function FloatingCard({ className, rarity, name, type, power, rotation, colorTop, colorBot }: {
  className?: string
  rarity: 'legendary' | 'rare' | 'common'
  name: string; type: string; power: string; rotation: number; colorTop: string; colorBot: string
}) {
  const rarityBadge = {
    legendary: { label: '★ LEGGENDARIA', color: '#ffd700', glow: 'rgba(255,215,0,0.6)' },
    rare:      { label: '◆ RARA',        color: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
    common:    { label: '● COMUNE',       color: '#6ee7b7', glow: 'rgba(110,231,183,0.4)' },
  }[rarity]

  return (
    <div className={`card-hover ${className ?? ''}`}
      style={{ transform: `rotate(${rotation}deg)`, width: 120, height: 170, borderRadius: 10, background: `linear-gradient(160deg, ${colorTop} 0%, ${colorBot} 100%)`, boxShadow: `0 0 30px ${rarityBadge.glow}, 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)`, border: `1.5px solid ${rarityBadge.color}44`, position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)', pointerEvents: 'none' }} />
      <div style={{ margin: '8px 8px 0', height: 72, borderRadius: 6, background: `radial-gradient(ellipse at 40% 30%, ${rarityBadge.color}33 0%, rgba(0,0,0,0.5) 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: `1px solid ${rarityBadge.color}22` }}>
        {rarity === 'legendary' ? <Icon.sword style={{ width: 32, height: 32, color: '#ffd700', opacity: 0.9 }} /> : rarity === 'rare' ? <Icon.gem style={{ width: 28, height: 28, color: '#a78bfa', opacity: 0.9 }} /> : <Icon.shield style={{ width: 28, height: 28, color: '#6ee7b7', opacity: 0.9 }} />}
      </div>
      <div className="font-cinzel" style={{ padding: '4px 8px 2px', fontSize: 8, fontWeight: 700, color: rarityBadge.color, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      <div style={{ margin: '0 8px', padding: '2px 6px', background: 'rgba(0,0,0,0.5)', borderRadius: 3, fontSize: 7, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>{type}</div>
      <div style={{ margin: '4px 8px', padding: '4px 6px', background: 'rgba(0,0,0,0.4)', borderRadius: 4, fontSize: 6.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
        {rarity === 'legendary' ? '"Nessuno osa sfidare il suo potere."' : rarity === 'rare' ? '"La magia scorre nel suo sangue."' : '"Fedele fino alla fine."'}
      </div>
      <div style={{ position: 'absolute', bottom: 6, right: 8, width: 22, height: 22, borderRadius: '50%', background: rarityBadge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#06080f', fontFamily: 'Cinzel, serif', boxShadow: `0 0 10px ${rarityBadge.glow}` }}>{power}</div>
      <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 6, color: rarityBadge.color, letterSpacing: '0.06em' }}>{rarityBadge.label}</div>
    </div>
  )
}

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({ id: i, left: `${5 + (i * 5.3) % 90}%`, bottom: `${(i * 7.7) % 30}%`, size: 2 + (i % 4), duration: 4 + (i % 5), delay: (i * 0.6) % 5 }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  )
}

function NavBtn({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="font-cinzel"
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: active ? '1px solid rgba(240,165,0,0.5)' : '1px solid transparent', background: active ? 'rgba(240,165,0,0.12)' : 'transparent', color: active ? '#f0a500' : 'rgba(232,220,200,0.65)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = '#e8dcc8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,220,200,0.65)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' } }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  )
}

function ModeCard({ icon, title, desc, tag, accent, delay, onClick }: { icon: ReactNode; title: string; desc: string; tag?: string; accent: string; delay: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button className={`card-hover slide-up-${delay}`} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? `linear-gradient(145deg, rgba(13,17,32,0.95) 0%, ${accent}15 100%)` : 'linear-gradient(145deg, rgba(13,17,32,0.8) 0%, rgba(6,8,15,0.9) 100%)', border: `1px solid ${hov ? accent + '55' : 'rgba(240,165,0,0.12)'}`, borderRadius: 16, padding: '24px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
      {hov && <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${accent}33 0%, transparent 70%)`, pointerEvents: 'none' }} />}
      <div style={{ marginBottom: 12, display: 'flex' }}>{icon}</div>
      <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: '#e8dcc8', letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.55)', lineHeight: 1.5, marginBottom: 12 }}>{desc}</div>
      {tag && <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: accent + '22', border: `1px solid ${accent}44`, fontSize: 10, color: accent, fontFamily: 'Cinzel, serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tag}</div>}
    </button>
  )
}

// Badge con il conteggio reale della collezione (carte pubblicate dallo Studio)
function RankBadge({ cardCount }: { cardCount: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(13,17,32,0.8)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 12, backdropFilter: 'blur(10px)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f0a500, #d4842a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 15px rgba(240,165,0,0.4)', flexShrink: 0 }}>
        <Icon.cards style={{ width: 18, height: 18, color: '#06080f' }} />
      </div>
      <div>
        <div className="font-cinzel" style={{ fontSize: 11, fontWeight: 700, color: '#f0a500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Collezione</div>
        <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.5)', marginTop: 1 }}>{cardCount} {cardCount === 1 ? 'carta' : 'carte'}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeNav, setActiveNav] = useState('home')
  const [season, setSeason] = useState(0)
  const seasons = ['Stagione delle Fiamme', 'Stagione del Ghiaccio', 'Stagione del Tuono']

  // Carte reali pubblicate dallo Studio (sync live)
  const { cards } = useRealCards()

  // Carta in evidenza = la più rara della collezione (a parità, la prima)
  const featured = useMemo(() => {
    if (!cards.length) return null
    return [...cards].sort((a, b) => (RARITY_RANK[b.rarity] ?? 0) - (RARITY_RANK[a.rarity] ?? 0))[0]
  }, [cards])

  // Conteggio per rarità (solo quelle presenti), dalla più rara
  const rarityBreakdown = useMemo(() => {
    return ['mythic', 'legendary', 'epic', 'rare', 'common']
      .map(r => ({ r, n: cards.filter(c => c.rarity === r).length }))
      .filter(x => x.n > 0)
  }, [cards])

  useEffect(() => {
    const t = setInterval(() => setSeason(s => (s + 1) % seasons.length), 4000)
    return () => clearInterval(t)
  }, [])

  const isFull = activeNav === 'deck' || activeNav === 'packs' || activeNav === 'collection' || activeNav === 'arena'

  return (
    <div style={{ minHeight: '100vh', height: isFull ? '100vh' : undefined, background: '#06080f', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,15,5,0.9) 0%, #06080f 70%)' }} />
        <div className="glow-orb" style={{ position: 'absolute', left: '-10%', top: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(180,80,10,0.25) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="glow-orb" style={{ position: 'absolute', right: '-8%', top: '30%', width: 450, height: 450, background: 'radial-gradient(circle, rgba(90,40,150,0.2) 0%, transparent 70%)', borderRadius: '50%', animationDelay: '2s' }} />
        <div className="glow-orb" style={{ position: 'absolute', left: '30%', top: '-10%', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(240,165,0,0.1) 0%, transparent 65%)', animationDelay: '1s' }} />
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: `${(i * 17.3) % 100}%`, top: `${(i * 13.7) % 100}%`, width: i % 5 === 0 ? 2 : 1, height: i % 5 === 0 ? 2 : 1, borderRadius: '50%', background: `rgba(255,255,255,${0.15 + (i % 4) * 0.1})` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(240,165,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(240,165,0,0.025) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, #06080f 0%, transparent 100%)' }} />
      </div>

      {activeNav === 'home' && <Particles />}

      {activeNav === 'home' && <>
        <div style={{ position: 'fixed', left: '-20px', top: '20%', zIndex: 1, opacity: 0.5 }} className="float-card-2">
          <FloatingCard rarity="rare" name="Maga Oscura" type="Evocatore • Arcano" power="7" rotation={-12} colorTop="#1a0f2e" colorBot="#2d1a4a" />
        </div>
        <div style={{ position: 'fixed', left: '50px', top: '55%', zIndex: 1, opacity: 0.3 }} className="float-card-3">
          <FloatingCard rarity="common" name="Guardiano" type="Guerriero • Terra" power="4" rotation={8} colorTop="#0f1a10" colorBot="#1a2e1a" />
        </div>
        <div style={{ position: 'fixed', right: '-10px', top: '15%', zIndex: 1, opacity: 0.5 }} className="float-card">
          <FloatingCard rarity="legendary" name="Drago Infuocato" type="Bestia • Fuoco" power="12" rotation={14} colorTop="#2e1000" colorBot="#4a1f00" />
        </div>
        <div style={{ position: 'fixed', right: '60px', top: '60%', zIndex: 1, opacity: 0.3 }} className="float-card-2">
          <FloatingCard rarity="rare" name="Arciere Elfico" type="Arciere • Natura" power="6" rotation={-6} colorTop="#0a1e0a" colorBot="#152b15" />
        </div>
      </>}

      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 64, borderBottom: '1px solid rgba(240,165,0,0.08)', background: 'rgba(6,8,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f0a500, #c8860a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(240,165,0,0.4)' }}>
            <Icon.sword style={{ width: 20, height: 20, color: '#06080f' }} />
          </div>
          <div>
            <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 900, color: '#f0a500', letterSpacing: '0.12em', lineHeight: 1 }}>CARD CLASH</div>
            <div style={{ fontSize: 9, color: 'rgba(232,220,200,0.4)', letterSpacing: '0.15em' }}>TCG ARENA</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavBtn icon={<Icon.home style={{ width: 14, height: 14 }} />} label="Home" active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
          <NavBtn icon={<Icon.package style={{ width: 14, height: 14 }} />} label="Pacchetti" active={activeNav === 'packs'} onClick={() => setActiveNav('packs')} />
          <NavBtn icon={<Icon.collection style={{ width: 14, height: 14 }} />} label="Collezione" active={activeNav === 'collection'} onClick={() => setActiveNav('collection')} />
          <NavBtn icon={<Icon.cards style={{ width: 14, height: 14 }} />} label="Deck Builder" active={activeNav === 'deck'} onClick={() => setActiveNav('deck')} />
          <NavBtn icon={<Icon.sword style={{ width: 14, height: 14 }} />} label="Arena" active={activeNav === 'arena'} onClick={() => setActiveNav('arena')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RankBadge cardCount={cards.length} />
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2d1a4a, #0d1120)', border: '2px solid rgba(240,165,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon.wizard style={{ width: 18, height: 18, color: '#f0a500' }} />
          </div>
        </div>
      </nav>

      {activeNav === 'deck' && <div style={{ position: 'relative', zIndex: 5 }}><RealDeckBuilder /></div>}
      {activeNav === 'packs' && <div style={{ position: 'relative', zIndex: 5 }}><PackOpening /></div>}
      {activeNav === 'collection' && <div style={{ position: 'relative', zIndex: 5 }}><RealCollection /></div>}
      {activeNav === 'arena' && <div style={{ position: 'relative', zIndex: 5 }}><RealArena /></div>}

      {activeNav === 'home' && <main style={{ position: 'relative', zIndex: 5, maxWidth: 1100, margin: '0 auto', padding: '60px 32px 80px' }}>
        <div className="slide-up-1" style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 20, background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', fontSize: 11, color: '#f0a500', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <Icon.fire style={{ width: 12, height: 12, opacity: 0.7, color: '#f0a500' }} />
            <span style={{ transition: 'opacity 0.5s ease' }}>{seasons[season]}</span>
            <span style={{ padding: '2px 8px', background: 'rgba(240,165,0,0.15)', borderRadius: 10, fontSize: 10 }}>Stagione 1</span>
          </div>
        </div>
        <div className="slide-up-2" style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 className="font-cinzel-deco title-glow" style={{ fontSize: 'clamp(36px, 7vw, 80px)', fontWeight: 700, lineHeight: 1, margin: 0, letterSpacing: '0.05em' }}>
            <span className="shimmer-text">Pocket fantasya</span>
          </h1>
          <div className="font-cinzel" style={{ fontSize: 'clamp(10px, 2vw, 14px)', letterSpacing: '0.35em', color: 'rgba(232,220,200,0.4)', marginTop: 10, textTransform: 'uppercase' }}>
            Trading Card Game · Arena Ufficiale
          </div>
        </div>
        <div className="slide-up-3" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 15, color: 'rgba(232,220,200,0.55)', fontWeight: 300, letterSpacing: '0.02em', margin: 0 }}>
            Costruisci il tuo mazzo. Sfida i migliori. Diventa leggenda.
          </p>
        </div>
        <div className="slide-up-3" style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 72, flexWrap: 'wrap' }}>
          <button className="btn-primary font-cinzel badge-pulse" onClick={() => setActiveNav('arena')}
            style={{ padding: '16px 44px', borderRadius: 12, background: 'linear-gradient(135deg, #f0a500, #d4842a)', border: 'none', color: '#06080f', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 30px rgba(240,165,0,0.35)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.sword style={{ width: 16, height: 16 }} /> Gioca Ora</span>
          </button>
          <button className="btn-primary font-cinzel" onClick={() => setActiveNav('packs')}
            style={{ padding: '16px 36px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(240,165,0,0.35)', color: '#f0a500', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.package style={{ width: 16, height: 16 }} /> Apri Pacchetti</span>
          </button>
        </div>
        <div className="slide-up-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          <ModeCard icon={<Icon.sword style={{ width: 36, height: 36, color: '#f0a500' }} />} title="Arena Battaglia" desc="Sfida giocatori in tempo reale. Scala i ranghi fino al Diamante." tag="PvP Ranked" accent="#f0a500" delay="1" onClick={() => setActiveNav('arena')} />
          <ModeCard icon={<Icon.trophy style={{ width: 36, height: 36, color: '#a78bfa' }} />} title="Torneo Stagionale" desc="Partecipa ai tornei settimanali per vincere carte esclusive." tag="Nuovo evento" accent="#a78bfa" delay="2" />
          <ModeCard icon={<Icon.book style={{ width: 36, height: 36, color: '#6ee7b7' }} />} title="Campagna" desc="Affronta la storia di Card Clash attraverso 8 capitoli epici." tag="Solo" accent="#6ee7b7" delay="3" />
          <ModeCard icon={<Icon.bot style={{ width: 36, height: 36, color: '#60a5fa' }} />} title="Allenamento" desc="Metti alla prova il tuo mazzo contro l'IA senza rischiare il rango." accent="#60a5fa" delay="4" onClick={() => setActiveNav('arena')} />
        </div>
        <div className="slide-up-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
          {/* La tua collezione — dati reali dallo Studio */}
          <div style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="font-cinzel" style={{ fontSize: 12, fontWeight: 700, color: '#e8dcc8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>La Tua Collezione</div>
              <button onClick={() => setActiveNav('collection')} style={{ background: 'none', border: 'none', fontSize: 10, color: 'rgba(240,165,0,0.7)', cursor: 'pointer', fontFamily: 'Cinzel,serif', letterSpacing: '0.06em' }}>Vedi tutte →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
              <div className="font-cinzel" style={{ fontSize: 34, fontWeight: 800, color: '#f0a500', lineHeight: 1 }}>{cards.length}</div>
              <div style={{ fontSize: 12, color: 'rgba(232,220,200,0.4)' }}>carte create</div>
            </div>
            {rarityBreakdown.length === 0 ? (
              <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.4)', lineHeight: 1.6 }}>
                Non hai ancora carte. Aprile nel <strong style={{ color: '#f0a500' }}>Card Creator Studio</strong> e appariranno qui.
              </div>
            ) : rarityBreakdown.map(({ r, n }, i) => {
              const meta = rarInfo(r)
              const pct = cards.length ? (n / cards.length) * 100 : 0
              return (
                <div key={r} style={{ marginBottom: i < rarityBreakdown.length - 1 ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ fontSize: 11, color: meta.color, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Cinzel,serif' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                      {meta.label.replace(/^[^A-Za-z]+/, '')}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.7)', fontWeight: 700, fontFamily: 'Cinzel,serif' }}>{n}</div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: meta.color, transition: 'width 1s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Carta in evidenza — la carta reale più rara della collezione */}
          <button onClick={() => setActiveNav('collection')} style={{ textAlign: 'left', background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(240,165,0,0.12)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(10px)', position: 'relative', cursor: 'pointer', padding: 0 }}>
            <div style={{ height: 132, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: `linear-gradient(135deg, ${(featured?.accentColor || '#f0a500')}22 0%, #1a0f05 60%, #0d0a05 100%)` }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 50%, ${(featured?.accentColor || '#f0a500')}33 0%, transparent 60%)` }} />
              {featured?.imageUrl
                ? <img src={featured.imageUrl} alt={featured.name} style={{ height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }} />
                : <Icon.cards style={{ width: 52, height: 52, color: featured ? rarInfo(featured.rarity).color : '#f0a500' }} />}
              <div style={{ position: 'absolute', top: 10, left: 16, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'rgba(240,165,0,0.85)', borderRadius: 20, fontSize: 9, color: '#06080f', fontFamily: 'Cinzel, serif', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Icon.star style={{ width: 10, height: 10, color: '#06080f' }} /> Carta in Evidenza
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div className="font-cinzel" style={{ fontSize: 14, fontWeight: 700, color: featured ? rarInfo(featured.rarity).color : '#ffd700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                {featured?.name || 'Nessuna carta ancora'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,220,200,0.55)', lineHeight: 1.5, marginBottom: 12, minHeight: 32 }}>
                {featured ? (featured.abilityText || 'La gemma più rara della tua collezione.') : 'Crea la tua prima carta nel Card Creator Studio per vederla qui.'}
              </div>
              {featured && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ padding: '3px 10px', borderRadius: 10, background: `${rarInfo(featured.rarity).color}1a`, border: `1px solid ${rarInfo(featured.rarity).color}44`, fontSize: 9, color: rarInfo(featured.rarity).color, fontFamily: 'Cinzel,serif' }}>{rarInfo(featured.rarity).label}</div>
                  <div style={{ padding: '3px 10px', borderRadius: 10, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', fontSize: 9, color: 'rgba(232,220,200,0.7)' }}>{String(featured.type || '').toUpperCase()}</div>
                  {featured.type === 'CREATURA' && <div style={{ padding: '3px 10px', borderRadius: 10, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', fontSize: 9, color: 'rgba(232,220,200,0.7)' }}>⚔ {featured.atk} / {featured.hp} ❤</div>}
                </div>
              )}
            </div>
          </button>
        </div>
      </main>}

      {activeNav === 'home' && <footer style={{ position: 'relative', zIndex: 5, borderTop: '1px solid rgba(240,165,0,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,8,15,0.6)', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.3)', letterSpacing: '0.08em' }}>© 2026 Card Clash TCG — Gioco Ufficiale</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ l: 'Supporto', href: '#' }, { l: 'Termini', href: '#' }, { l: 'Privacy', href: '#' }, { l: 'Studio Creatori', href: '/#creator' }].map(({ l, href }) => (
            <a key={l} href={href} style={{ fontSize: 10, color: 'rgba(232,220,200,0.3)', textDecoration: 'none', letterSpacing: '0.06em', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0a500')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,220,200,0.3)')}>{l}</a>
          ))}
        </div>
      </footer>}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'

// ── Floating TCG card (pure CSS) ──────────────────────────────────────────────
function FloatingCard({
  className,
  rarity,
  name,
  type,
  power,
  rotation,
  colorTop,
  colorBot,
}: {
  className?: string
  rarity: 'legendary' | 'rare' | 'common'
  name: string
  type: string
  power: string
  rotation: number
  colorTop: string
  colorBot: string
}) {
  const rarityBadge = {
    legendary: { label: '★ LEGGENDARIA', color: '#ffd700', glow: 'rgba(255,215,0,0.6)' },
    rare:      { label: '◆ RARA',        color: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
    common:    { label: '● COMUNE',       color: '#6ee7b7', glow: 'rgba(110,231,183,0.4)' },
  }[rarity]

  return (
    <div
      className={`card-hover ${className ?? ''}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        width: 120,
        height: 170,
        borderRadius: 10,
        background: `linear-gradient(160deg, ${colorTop} 0%, ${colorBot} 100%)`,
        boxShadow: `0 0 30px ${rarityBadge.glow}, 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)`,
        border: `1.5px solid ${rarityBadge.color}44`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Sheen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
        pointerEvents: 'none',
      }} />
      {/* Art area */}
      <div style={{
        margin: '8px 8px 0',
        height: 72,
        borderRadius: 6,
        background: `radial-gradient(ellipse at 40% 30%, ${rarityBadge.color}33 0%, rgba(0,0,0,0.5) 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        border: `1px solid ${rarityBadge.color}22`,
      }}>
        {rarity === 'legendary' ? '⚔️' : rarity === 'rare' ? '🔮' : '🛡️'}
      </div>
      {/* Name */}
      <div className="font-cinzel" style={{
        padding: '4px 8px 2px',
        fontSize: 8,
        fontWeight: 700,
        color: rarityBadge.color,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{name}</div>
      {/* Type bar */}
      <div style={{
        margin: '0 8px',
        padding: '2px 6px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 3,
        fontSize: 7,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.08em',
      }}>{type}</div>
      {/* Text box */}
      <div style={{
        margin: '4px 8px',
        padding: '4px 6px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 4,
        fontSize: 6.5,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.4,
        fontFamily: 'Inter, sans-serif',
      }}>
        {rarity === 'legendary'
          ? '"Nessuno osa sfidare il suo potere."'
          : rarity === 'rare'
          ? '"La magia scorre nel suo sangue."'
          : '"Fedele fino alla fine."'}
      </div>
      {/* Power */}
      <div style={{
        position: 'absolute', bottom: 6, right: 8,
        width: 22, height: 22, borderRadius: '50%',
        background: rarityBadge.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700,
        color: '#06080f',
        fontFamily: 'Cinzel, serif',
        boxShadow: `0 0 10px ${rarityBadge.glow}`,
      }}>{power}</div>
      {/* Rarity badge */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        fontSize: 6,
        color: rarityBadge.color,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.06em',
      }}>{rarityBadge.label}</div>
    </div>
  )
}

// ── Particle system ───────────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 5.3) % 90}%`,
    bottom: `${(i * 7.7) % 30}%`,
    size: 2 + (i % 4),
    duration: 4 + (i % 5),
    delay: (i * 0.6) % 5,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Nav button ────────────────────────────────────────────────────────────────
function NavBtn({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-cinzel"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px',
        borderRadius: 8,
        border: active ? '1px solid rgba(240,165,0,0.5)' : '1px solid transparent',
        background: active ? 'rgba(240,165,0,0.12)' : 'transparent',
        color: active ? '#f0a500' : 'rgba(232,220,200,0.65)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.color = '#e8dcc8'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,220,200,0.65)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  )
}

// ── Mode card ─────────────────────────────────────────────────────────────────
function ModeCard({
  icon, title, desc, tag, accent, delay, onClick,
}: {
  icon: string; title: string; desc: string; tag?: string; accent: string; delay: string; onClick?: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      className={`card-hover slide-up-${delay}`}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? `linear-gradient(145deg, rgba(13,17,32,0.95) 0%, ${accent}15 100%)`
          : 'linear-gradient(145deg, rgba(13,17,32,0.8) 0%, rgba(6,8,15,0.9) 100%)',
        border: `1px solid ${hov ? accent + '55' : 'rgba(240,165,0,0.12)'}`,
        borderRadius: 16,
        padding: '24px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner glow */}
      {hov && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 80, height: 80,
          background: `radial-gradient(circle at top right, ${accent}33 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div className="font-cinzel" style={{
        fontSize: 14, fontWeight: 700, color: '#e8dcc8',
        letterSpacing: '0.06em', marginBottom: 6,
        textTransform: 'uppercase',
      }}>{title}</div>
      <div style={{
        fontSize: 12, color: 'rgba(232,220,200,0.55)',
        lineHeight: 1.5, marginBottom: 12,
      }}>{desc}</div>
      {tag && (
        <div style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 20,
          background: accent + '22',
          border: `1px solid ${accent}44`,
          fontSize: 10,
          color: accent,
          fontFamily: 'Cinzel, serif',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>{tag}</div>
      )}
    </button>
  )
}

// ── Rank badge ────────────────────────────────────────────────────────────────
function RankBadge() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      background: 'rgba(13,17,32,0.8)',
      border: '1px solid rgba(240,165,0,0.2)',
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, #f0a500, #d4842a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
        boxShadow: '0 0 15px rgba(240,165,0,0.4)',
        flexShrink: 0,
      }}>⚔️</div>
      <div>
        <div className="font-cinzel" style={{
          fontSize: 11, fontWeight: 700, color: '#f0a500',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Oro III</div>
        <div style={{ fontSize: 10, color: 'rgba(232,220,200,0.5)', marginTop: 1 }}>
          1 204 / 1 500 PG
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState('home')
  const [season, setSeason] = useState(0)
  const seasons = ['Stagione delle Fiamme', 'Stagione del Ghiaccio', 'Stagione del Tuono']

  useEffect(() => {
    const t = setInterval(() => setSeason(s => (s + 1) % seasons.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06080f',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Background atmospheric layers ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        {/* Deep nebula */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,15,5,0.9) 0%, #06080f 70%)',
        }} />
        {/* Left glow orb */}
        <div className="glow-orb" style={{
          position: 'absolute', left: '-10%', top: '20%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(180,80,10,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        {/* Right glow orb */}
        <div className="glow-orb" style={{
          position: 'absolute', right: '-8%', top: '30%',
          width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(90,40,150,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          animationDelay: '2s',
        }} />
        {/* Center top glow */}
        <div className="glow-orb" style={{
          position: 'absolute', left: '30%', top: '-10%',
          width: 600, height: 400,
          background: 'radial-gradient(ellipse, rgba(240,165,0,0.1) 0%, transparent 65%)',
          animationDelay: '1s',
        }} />
        {/* Star field */}
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 17.3) % 100}%`,
            top: `${(i * 13.7) % 100}%`,
            width: i % 5 === 0 ? 2 : 1,
            height: i % 5 === 0 ? 2 : 1,
            borderRadius: '50%',
            background: `rgba(255,255,255,${0.15 + (i % 4) * 0.1})`,
          }} />
        ))}
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(240,165,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,165,0,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(to top, #06080f 0%, transparent 100%)',
        }} />
      </div>

      <Particles />

      {/* ── Floating cards (background decoration) ── */}
      <div style={{
        position: 'fixed', left: '-20px', top: '20%',
        zIndex: 1, opacity: 0.5,
      }} className="float-card-2">
        <FloatingCard
          rarity="rare" name="Maga Oscura" type="Evocatore • Arcano"
          power="7" rotation={-12} colorTop="#1a0f2e" colorBot="#2d1a4a"
        />
      </div>
      <div style={{
        position: 'fixed', left: '50px', top: '55%',
        zIndex: 1, opacity: 0.3,
      }} className="float-card-3">
        <FloatingCard
          rarity="common" name="Guardiano" type="Guerriero • Terra"
          power="4" rotation={8} colorTop="#0f1a10" colorBot="#1a2e1a"
        />
      </div>
      <div style={{
        position: 'fixed', right: '-10px', top: '15%',
        zIndex: 1, opacity: 0.5,
      }} className="float-card">
        <FloatingCard
          rarity="legendary" name="Drago Infuocato" type="Bestia • Fuoco"
          power="12" rotation={14} colorTop="#2e1000" colorBot="#4a1f00"
        />
      </div>
      <div style={{
        position: 'fixed', right: '60px', top: '60%',
        zIndex: 1, opacity: 0.3,
      }} className="float-card-2">
        <FloatingCard
          rarity="rare" name="Arciere Elfico" type="Arciere • Natura"
          power="6" rotation={-6} colorTop="#0a1e0a" colorBot="#152b15"
        />
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        height: 64,
        borderBottom: '1px solid rgba(240,165,0,0.08)',
        background: 'rgba(6,8,15,0.85)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f0a500, #c8860a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 0 20px rgba(240,165,0,0.4)',
          }}>⚔</div>
          <div>
            <div className="font-cinzel" style={{
              fontSize: 14, fontWeight: 900, color: '#f0a500',
              letterSpacing: '0.12em', lineHeight: 1,
            }}>CARD CLASH</div>
            <div style={{
              fontSize: 9, color: 'rgba(232,220,200,0.4)',
              letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif',
            }}>TCG ARENA</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavBtn icon="🏠" label="Home" active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
          <NavBtn icon="📦" label="Pacchetti" active={activeNav === 'packs'} onClick={() => setActiveNav('packs')} />
          <NavBtn icon="📚" label="Collezione" active={activeNav === 'collection'} onClick={() => setActiveNav('collection')} />
          <NavBtn icon="🃏" label="Deck Builder" active={activeNav === 'deck'} onClick={() => setActiveNav('deck')} />
        </div>

        {/* Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RankBadge />
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2d1a4a, #0d1120)',
            border: '2px solid rgba(240,165,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
          }}>🧙</div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1100,
        margin: '0 auto',
        padding: '60px 32px 80px',
      }}>
        {/* Season ribbon */}
        <div className="slide-up-1" style={{
          display: 'flex', justifyContent: 'center', marginBottom: 32,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px',
            borderRadius: 20,
            background: 'rgba(240,165,0,0.08)',
            border: '1px solid rgba(240,165,0,0.2)',
            fontSize: 11,
            color: '#f0a500',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            <span style={{ opacity: 0.6 }}>🔥</span>
            <span style={{
              transition: 'opacity 0.5s ease',
            }}>{seasons[season]}</span>
            <span style={{
              padding: '2px 8px',
              background: 'rgba(240,165,0,0.15)',
              borderRadius: 10,
              fontSize: 10,
            }}>Stagione 7</span>
          </div>
        </div>

        {/* Hero title */}
        <div className="slide-up-2" style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1
            className="font-cinzel-deco title-glow"
            style={{
              fontSize: 'clamp(36px, 7vw, 80px)',
              fontWeight: 700,
              lineHeight: 1,
              margin: 0,
              letterSpacing: '0.05em',
            }}
          >
            <span className="shimmer-text">CARD CLASH</span>
          </h1>
          <div className="font-cinzel" style={{
            fontSize: 'clamp(10px, 2vw, 14px)',
            letterSpacing: '0.35em',
            color: 'rgba(232,220,200,0.4)',
            marginTop: 10,
            textTransform: 'uppercase',
          }}>
            Trading Card Game · Arena Ufficiale
          </div>
        </div>

        {/* Tagline */}
        <div className="slide-up-3" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{
            fontSize: 15,
            color: 'rgba(232,220,200,0.55)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 300,
            letterSpacing: '0.02em',
            margin: 0,
          }}>
            Costruisci il tuo mazzo. Sfida i migliori. Diventa leggenda.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="slide-up-3" style={{
          display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 72, flexWrap: 'wrap',
        }}>
          <button
            className="btn-primary font-cinzel badge-pulse"
            style={{
              padding: '16px 44px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f0a500, #d4842a)',
              border: 'none',
              color: '#06080f',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(240,165,0,0.35)',
            }}
          >
            ⚔ Gioca Ora
          </button>
          <button
            className="btn-primary font-cinzel"
            style={{
              padding: '16px 36px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(240,165,0,0.35)',
              color: '#f0a500',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            📦 Apri Pacchetti
          </button>
        </div>

        {/* Mode grid */}
        <div className="slide-up-4" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}>
          <ModeCard
            icon="⚔️"
            title="Arena Battaglia"
            desc="Sfida giocatori in tempo reale. Scala i ranghi fino al Diamante."
            tag="PvP Ranked"
            accent="#f0a500"
            delay="1"
          />
          <ModeCard
            icon="🏆"
            title="Torneo Stagionale"
            desc="Partecipa ai tornei settimanali per vincere carte esclusive."
            tag="Nuovo evento"
            accent="#a78bfa"
            delay="2"
          />
          <ModeCard
            icon="📖"
            title="Campagna"
            desc="Affronta la storia di Card Clash attraverso 8 capitoli epici."
            tag="Solo"
            accent="#6ee7b7"
            delay="3"
          />
          <ModeCard
            icon="🤖"
            title="Allenamento"
            desc="Metti alla prova il tuo mazzo contro l'IA senza rischiare il rango."
            accent="#60a5fa"
            delay="4"
          />
        </div>

        {/* Daily quests + news row */}
        <div className="slide-up-5" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 16,
        }}>
          {/* Daily quests */}
          <div style={{
            background: 'rgba(13,17,32,0.7)',
            border: '1px solid rgba(240,165,0,0.12)',
            borderRadius: 16,
            padding: '20px 24px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div className="font-cinzel" style={{
                fontSize: 12, fontWeight: 700, color: '#e8dcc8',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Missioni Giornaliere</div>
              <div style={{
                fontSize: 10, color: 'rgba(240,165,0,0.7)',
                fontFamily: 'Inter, sans-serif',
              }}>Resetta in 14:23:10</div>
            </div>
            {[
              { label: 'Vinci 3 partite ranked', xp: '+150 XP', prog: 2, tot: 3, done: false },
              { label: 'Gioca 5 carte leggendarie', xp: '+200 XP', prog: 5, tot: 5, done: true },
              { label: 'Apri 1 pacchetto booster', xp: '+50 XP', prog: 0, tot: 1, done: false },
            ].map((q, i) => (
              <div key={i} style={{
                marginBottom: i < 2 ? 14 : 0,
                opacity: q.done ? 0.5 : 1,
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 5,
                }}>
                  <div style={{
                    fontSize: 12, color: q.done ? 'rgba(232,220,200,0.4)' : 'rgba(232,220,200,0.8)',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {q.done && <span style={{ color: '#6ee7b7' }}>✓</span>}
                    {q.label}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#f0a500',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                  }}>{q.xp}</div>
                </div>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(q.prog / q.tot) * 100}%`,
                    borderRadius: 2,
                    background: q.done
                      ? 'linear-gradient(90deg, #6ee7b7, #34d399)'
                      : 'linear-gradient(90deg, #f0a500, #d4842a)',
                    transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{
                  fontSize: 9, color: 'rgba(232,220,200,0.35)',
                  marginTop: 3, fontFamily: 'Inter, sans-serif',
                }}>{q.prog}/{q.tot}</div>
              </div>
            ))}
          </div>

          {/* News / featured card */}
          <div style={{
            background: 'rgba(13,17,32,0.7)',
            border: '1px solid rgba(240,165,0,0.12)',
            borderRadius: 16,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            position: 'relative',
          }}>
            {/* Art banner */}
            <div style={{
              height: 100,
              background: 'linear-gradient(135deg, #1a0500 0%, #3d1500 40%, #2e0a00 100%)',
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 60% 50%, rgba(240,100,0,0.3) 0%, transparent 60%)',
              }} />
              <div style={{
                fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(240,100,0,0.8))',
              }}>🐉</div>
              <div style={{
                position: 'absolute', top: 10, left: 16,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px',
                background: 'rgba(240,165,0,0.85)',
                borderRadius: 20,
                fontSize: 9,
                color: '#06080f',
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>🔥 Carta in Evidenza</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div className="font-cinzel" style={{
                fontSize: 14, fontWeight: 700, color: '#ffd700',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Drago Infuocato Ancestrale</div>
              <div style={{
                fontSize: 11, color: 'rgba(232,220,200,0.55)',
                fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                marginBottom: 12,
              }}>
                La carta più rara della Stagione delle Fiamme. Disponibile solo fino al 15 agosto.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['★ Leggendaria', '🔥 Fuoco', '⚡ 12 ATK'].map((tag, i) => (
                  <div key={i} style={{
                    padding: '3px 10px',
                    borderRadius: 10,
                    background: 'rgba(240,165,0,0.1)',
                    border: '1px solid rgba(240,165,0,0.2)',
                    fontSize: 9,
                    color: 'rgba(232,220,200,0.7)',
                    fontFamily: 'Inter, sans-serif',
                  }}>{tag}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        position: 'relative', zIndex: 5,
        borderTop: '1px solid rgba(240,165,0,0.06)',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(6,8,15,0.6)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          fontSize: 10, color: 'rgba(232,220,200,0.3)',
          fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em',
        }}>
          © 2026 Card Clash TCG — Gioco Ufficiale
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Supporto', 'Termini', 'Privacy', 'Studio Creatori'].map(l => (
            <a key={l} href="#" style={{
              fontSize: 10, color: 'rgba(232,220,200,0.3)',
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'none', letterSpacing: '0.06em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0a500')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,220,200,0.3)')}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

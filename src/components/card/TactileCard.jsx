import React, { useState } from 'react';
import { Swords, Heart, Target } from 'lucide-react';

const RARITY_THEMES = {
  common: {
    accent: '#6C8D88',
    badge: 'Comune',
    foil: ''
  },
  rare: {
    accent: '#2563eb',
    badge: 'Rara',
    foil: ''
  },
  epic: {
    accent: '#9333ea',
    badge: 'Epica',
    foil: 'tactile-foil'
  },
  legendary: {
    accent: '#d97706',
    badge: 'Leggendaria',
    foil: 'tactile-foil'
  },
  mythic: {
    accent: '#e11d48',
    badge: 'Mitica',
    foil: 'tactile-foil'
  }
};

// Sizing configurations aligned with 1:1 Reaper Frog proportions (~50% height for artwork)
const SIZES = {
  sm: {
    width: 175,
    height: 250,
    padding: '6px 9px 6px',
    borderRadius: 14,
    ribbon: { width: 24, height: 44, left: 9, costSize: 12, glyphSize: 11, glyphMargin: 3 },
    titleSize: 10.5,
    subtitleSize: 7,
    headerPl: 25,
    artHeight: 120, // 48% of card height
    pipTile: 11,
    pipFont: 6.5,
    abilityFont: 8,
    abilityLineHeight: 1.2,
    flavorFont: 7,
    footerFont: 7
  },
  md: {
    width: 230,
    height: 330,
    padding: '8px 12px 8px',
    borderRadius: 18,
    ribbon: { width: 32, height: 56, left: 12, costSize: 17, glyphSize: 14, glyphMargin: 5 },
    titleSize: 13.5,
    subtitleSize: 8.5,
    headerPl: 34,
    artHeight: 160, // 48.5% of card height
    pipTile: 15,
    pipFont: 8,
    abilityFont: 10,
    abilityLineHeight: 1.3,
    flavorFont: 8.5,
    footerFont: 8.5
  },
  lg: {
    width: 280,
    height: 400,
    padding: '10px 15px 9px',
    borderRadius: 20,
    ribbon: { width: 38, height: 68, left: 14, costSize: 20, glyphSize: 17, glyphMargin: 7 },
    titleSize: 16,
    subtitleSize: 10,
    headerPl: 42,
    artHeight: 200, // 50% of card height
    pipTile: 17,
    pipFont: 9.5,
    abilityFont: 11.5,
    abilityLineHeight: 1.35,
    flavorFont: 9.5,
    footerFont: 9.5
  },
  xl: {
    width: 340,
    height: 485,
    padding: '12px 18px 11px',
    borderRadius: 22,
    ribbon: { width: 46, height: 82, left: 18, costSize: 25, glyphSize: 20, glyphMargin: 9 },
    titleSize: 19,
    subtitleSize: 11.5,
    headerPl: 48,
    artHeight: 245, // 50.5% of card height
    pipTile: 20,
    pipFont: 11.5,
    abilityFont: 13,
    abilityLineHeight: 1.4,
    flavorFont: 11,
    footerFont: 11
  }
};

export function TactileCard({ 
  card, 
  size = 'md', 
  interactive = true, 
  combatView = false, 
  onClick, 
  className = '',
  style = {}
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  if (!card) return null;

  const cfg = SIZES[size] || SIZES.md;
  const rarityInfo = RARITY_THEMES[card.rarity || 'common'] || RARITY_THEMES.common;
  const isCreature = (card.type || 'CREATURA').toUpperCase() === 'CREATURA';

  // 3D Tilt calculations
  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -8,
      y: (x / (rect.width / 2)) * 8
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: cfg.width,
        minWidth: cfg.width,
        maxWidth: cfg.width,
        height: cfg.height,
        minHeight: cfg.height,
        maxHeight: cfg.height,
        padding: cfg.padding,
        borderRadius: cfg.borderRadius,
        transform: interactive && isHovered 
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.03, 1.03, 1.03)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s ease-out',
        ...style
      }}
      className={`tactile-card-root group cursor-pointer ${rarityInfo.foil} ${className}`}
    >
      {/* Inset Hairline Double Frame */}
      <div className="tactile-card-inset-frame" style={{ borderRadius: cfg.borderRadius - 4 }} />

      {/* ============================================================ */}
      {/* CASE A: COMBAT VIEW (HERO BATTLEFIELD MODE)                  */}
      {/* ============================================================ */}
      {combatView ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
          
          {/* Top Hanging Ribbon & Mini Header */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: cfg.ribbon.height * 0.7 }}>
            {/* Hanging Teal Ribbon Banner */}
            <div 
              className="tactile-ribbon"
              style={{
                width: cfg.ribbon.width,
                height: cfg.ribbon.height,
                left: cfg.ribbon.left,
              }}
            >
              <span className="tactile-ribbon-cost" style={{ fontSize: cfg.ribbon.costSize }}>
                {card.cost ?? 1}
              </span>
              <div 
                className="tactile-ribbon-glyph" 
                style={{ 
                  width: cfg.ribbon.glyphSize, 
                  height: cfg.ribbon.glyphSize,
                  marginBottom: cfg.ribbon.glyphMargin
                }} 
              />
            </div>

            {/* Title & Stats Header */}
            <div style={{ flex: 1, textAlign: 'right', paddingLeft: cfg.headerPl, paddingTop: 1 }}>
              <div className="tactile-title" style={{ fontSize: cfg.titleSize }}>
                {card.name || 'Carta'}
              </div>
              <div className="tactile-subtitle" style={{ fontSize: cfg.subtitleSize }}>
                {card.type || 'CREATURA'}
              </div>
            </div>
          </div>

          {/* Center Battlefield Artwork Frame */}
          <div className="tactile-artwork-frame" style={{ height: cfg.artHeight }}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} />
            ) : (
              <Target style={{ width: cfg.artHeight * 0.4, height: cfg.artHeight * 0.4, color: '#6C8D88', opacity: 0.7 }} />
            )}
          </div>

          {/* Bottom ATK / HP Stat Capsules */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(108,141,136,0.25)', paddingTop: 3 }}>
            {isCreature ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#192523', color: '#fff', padding: '2px 7px', borderRadius: 5, fontSize: cfg.subtitleSize + 1, fontWeight: 800, fontFamily: 'Cinzel, serif' }}>
                  <Swords style={{ width: 10, height: 10, color: '#f59e0b' }} />
                  <span>{card.atk ?? 0}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#851e1e', color: '#fff', padding: '2px 7px', borderRadius: 5, fontSize: cfg.subtitleSize + 1, fontWeight: 800, fontFamily: 'Cinzel, serif' }}>
                  <Heart style={{ width: 10, height: 10, fill: '#fff', color: '#fff' }} />
                  <span>{card.currentHp ?? card.hp ?? 0}</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: cfg.subtitleSize, color: '#6C8D88', fontFamily: 'Cinzel, serif', fontWeight: 700, margin: '0 auto', letterSpacing: '0.1em' }}>
                ✦ {card.type || 'MAGIA'}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ============================================================ */
        /* CASE B: STANDARD FULL TACTILE CARD (1:1 REAPER FROG FIDELITY)*/
        /* ============================================================ */
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
          
          {/* Top Bar: Hanging Ribbon & Compact Title Header */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: cfg.ribbon.height * 0.7 }}>
            {/* Hanging Teal Ribbon Banner */}
            <div 
              className="tactile-ribbon"
              style={{
                width: cfg.ribbon.width,
                height: cfg.ribbon.height,
                left: cfg.ribbon.left,
              }}
            >
              <span className="tactile-ribbon-cost" style={{ fontSize: cfg.ribbon.costSize }}>
                {card.cost ?? 1}
              </span>
              <div 
                className="tactile-ribbon-glyph" 
                style={{ 
                  width: cfg.ribbon.glyphSize, 
                  height: cfg.ribbon.glyphSize,
                  marginBottom: cfg.ribbon.glyphMargin
                }} 
              />
            </div>

            {/* Card Title & Subtitle (Stats / Class) */}
            <div style={{ flex: 1, textAlign: 'center', paddingLeft: cfg.headerPl, paddingRight: 2, paddingTop: 1 }}>
              <div className="tactile-title" style={{ fontSize: cfg.titleSize }}>
                {card.name || 'Senza Nome'}
              </div>
              <div className="tactile-subtitle" style={{ fontSize: cfg.subtitleSize }}>
                {isCreature 
                  ? `ATK: ${card.atk ?? 0}  •  HP: ${card.hp ?? 0}  •  ${card.type || 'CREATURA'}`
                  : `${card.type || 'MAGIA'}`
                }
              </div>
            </div>

            <div style={{ width: 6 }} />
          </div>

          {/* Grand Center Illustration Zone (Dominant Focus ~50%) */}
          <div className="tactile-artwork-frame" style={{ height: cfg.artHeight, maxHeight: cfg.artHeight }}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Target style={{ width: cfg.artHeight * 0.35, height: cfg.artHeight * 0.35, color: '#6C8D88', opacity: 0.6 }} />
                <span style={{ fontSize: cfg.subtitleSize, color: '#6C8D88', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>Illustrazione</span>
              </div>
            )}
          </div>

          {/* Geometric 4-Tile Command Pip Bar (Base for the character): ─── [ ◐ ] [ ◑ ] [ ◉ ] [ ⬝ ] ─── */}
          <div className="tactile-pip-bar">
            <div className="tactile-pip-line" />
            <div className="tactile-pip-tile" style={{ width: cfg.pipTile, height: cfg.pipTile, fontSize: cfg.pipFont }}>◐</div>
            <div className="tactile-pip-tile" style={{ width: cfg.pipTile, height: cfg.pipTile, fontSize: cfg.pipFont }}>◑</div>
            <div className="tactile-pip-tile" style={{ width: cfg.pipTile, height: cfg.pipTile, fontSize: cfg.pipFont }}>◉</div>
            <div className="tactile-pip-tile" style={{ width: cfg.pipTile, height: cfg.pipTile, fontSize: cfg.pipFont }}>⬝</div>
            <div className="tactile-pip-line" />
          </div>

          {/* Ability Text Box & Italic Lore */}
          <div 
            className="tactile-ability-box" 
            style={{ 
              fontSize: cfg.abilityFont, 
              lineHeight: cfg.abilityLineHeight,
            }}
          >
            <p style={{ margin: 0 }}>
              {card.abilityTitle && (
                <span className="tactile-ability-keyword">
                  {card.abilityTitle}:
                </span>
              )}
              <span style={{ fontStyle: 'italic' }}>
                {card.abilityText || 'Nessuna abilità speciale.'}
              </span>
            </p>
            {card.flavorText && (
              <p className="tactile-flavor-text" style={{ fontSize: cfg.flavorFont, margin: '1px 0 0' }}>
                "{card.flavorText}"
              </p>
            )}
          </div>

          {/* Bottom Rarity & Category Marker */}
          <div className="tactile-card-footer" style={{ fontSize: cfg.footerFont }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✦ {rarityInfo.badge}
            </span>
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.12em', color: 'rgba(25, 37, 35, 0.7)' }}>
              #{card.id ? String(card.id).slice(-4) : '001'}
            </span>
          </div>

        </div>
      )}

    </div>
  );
}

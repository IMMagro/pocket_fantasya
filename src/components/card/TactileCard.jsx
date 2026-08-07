import React, { useState } from 'react';
import { Swords, Heart, Target, Sparkles, Crown, Palette } from 'lucide-react';

export const CARD_VARIANTS = {
  standard: {
    id: 'standard',
    label: 'Standard',
    badge: null,
    cssClass: '',
    tagColor: '#6C8D88'
  },
  holo: {
    id: 'holo',
    label: 'Olografica (Holo)',
    badge: '✨ HOLO',
    cssClass: 'tactile-holo',
    tagColor: '#38bdf8'
  },
  gold_foil: {
    id: 'gold_foil',
    label: 'Foil Dorata (Gold)',
    badge: '🌟 GOLD FOIL',
    cssClass: 'tactile-gold-foil',
    tagColor: '#f59e0b'
  },
  full_art: {
    id: 'full_art',
    label: 'Full-Art',
    badge: '🎨 FULL ART',
    cssClass: '',
    tagColor: '#10b981'
  },
  secret_holo: {
    id: 'secret_holo',
    label: 'Secret Rare (Full-Art Gold Holo)',
    badge: '👑 SECRET RARE',
    cssClass: 'tactile-secret-holo',
    tagColor: '#ec4899'
  }
};

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
    foil: 'tactile-holo'
  },
  legendary: {
    accent: '#d97706',
    badge: 'Leggendaria',
    foil: 'tactile-gold-foil'
  },
  mythic: {
    accent: '#e11d48',
    badge: 'Mitica',
    foil: 'tactile-secret-holo'
  }
};

// Sizing configurations aligned with 1:1 Reaper Frog proportions (~50% height for standard artwork)
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
    artHeight: 120,
    pipTile: 11,
    pipFont: 6.5,
    abilityFont: 8,
    abilityLineHeight: 1.2,
    flavorFont: 7,
    footerFont: 7,
    fullArtTagSize: 7
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
    artHeight: 160,
    pipTile: 15,
    pipFont: 8,
    abilityFont: 10,
    abilityLineHeight: 1.3,
    flavorFont: 8.5,
    footerFont: 8.5,
    fullArtTagSize: 8
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
    artHeight: 200,
    pipTile: 17,
    pipFont: 9.5,
    abilityFont: 11.5,
    abilityLineHeight: 1.35,
    flavorFont: 9.5,
    footerFont: 9.5,
    fullArtTagSize: 9
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
    artHeight: 245,
    pipTile: 20,
    pipFont: 11.5,
    abilityFont: 13,
    abilityLineHeight: 1.4,
    flavorFont: 11,
    footerFont: 11,
    fullArtTagSize: 10.5
  }
};

export function TactileCard({ 
  card, 
  size = 'md', 
  interactive = true, 
  combatView = false, 
  variant: forcedVariant,
  onClick, 
  className = '',
  style = {}
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  if (!card) return null;

  const cfg = SIZES[size] || SIZES.md;
  const cardRarity = card.rarity || 'common';
  const rarityInfo = RARITY_THEMES[cardRarity] || RARITY_THEMES.common;
  const isCreature = (card.type || 'CREATURA').toUpperCase() === 'CREATURA';

  // Active Variant determination (forced prop or card attribute or fallback from rarity)
  const activeVariantKey = forcedVariant || card.variant || (card.isFullArt ? 'full_art' : 'standard');
  const variantInfo = CARD_VARIANTS[activeVariantKey] || CARD_VARIANTS.standard;
  const isFullArtMode = activeVariantKey === 'full_art' || activeVariantKey === 'secret_holo' || !!card.isFullArt;

  // Active Special Finish Shader (from variant or rarity fallback)
  const finishShaderClass = variantInfo.cssClass || (activeVariantKey === 'standard' ? rarityInfo.foil : '');

  // 3D Tilt calculations
  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -9,
      y: (x / (rect.width / 2)) * 9
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
        padding: isFullArtMode ? '0' : cfg.padding,
        borderRadius: cfg.borderRadius,
        transform: interactive && isHovered 
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.035, 1.035, 1.035)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s ease-out',
        ...style
      }}
      className={`tactile-card-root group cursor-pointer ${finishShaderClass} ${className}`}
    >
      {/* Inset Hairline Double Frame (when not full-art) */}
      {!isFullArtMode && (
        <div className="tactile-card-inset-frame" style={{ borderRadius: cfg.borderRadius - 4 }} />
      )}

      {/* Variant Tag Badge (if special variant) */}
      {variantInfo.badge && (
        <div 
          className="tactile-variant-tag"
          style={{
            fontSize: cfg.fullArtTagSize,
            backgroundColor: variantInfo.tagColor,
            color: '#ffffff'
          }}
        >
          {variantInfo.badge}
        </div>
      )}

      {/* ============================================================ */}
      {/* CASE 1: FULL-ART CARD RENDERING (FULL-BLEED ARTWORK)         */}
      {/* ============================================================ */}
      {isFullArtMode ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          
          {/* Top Floating Hanging Ribbon */}
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

          {/* Top Floating Title Header */}
          <div 
            style={{ 
              position: 'absolute', 
              top: cfg.padding.split(' ')[0] || '8px', 
              left: 0, 
              right: 0, 
              paddingLeft: cfg.headerPl + 4, 
              paddingRight: 10,
              zIndex: 12,
              textAlign: 'center'
            }}
          >
            <div className="tactile-title" style={{ fontSize: cfg.titleSize, textShadow: '0 1px 4px rgba(250,247,238,0.9)' }}>
              {card.name || 'Senza Nome'}
            </div>
            <div className="tactile-subtitle" style={{ fontSize: cfg.subtitleSize, textShadow: '0 1px 2px rgba(250,247,238,0.8)' }}>
              {isCreature 
                ? `ATK: ${card.atk ?? 0} • HP: ${card.hp ?? 0} • ${card.type || 'CREATURA'}`
                : `${card.type || 'MAGIA'}`
              }
            </div>
          </div>

          {/* Full-Art Bleed Character Artwork Container */}
          <div className="tactile-fullart-container">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="tactile-fullart-img" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
                <Target style={{ width: 48, height: 48, color: '#6C8D88', opacity: 0.6 }} />
              </div>
            )}
          </div>

          {/* Soft Bottom Parchment Fade */}
          <div className="tactile-fullart-fade" />

          {/* Minimalist Floating Overlay at bottom */}
          <div className="tactile-fullart-info-overlay">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#d97706' }}>✦</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.abilityTitle || (isCreature ? 'MOSTRO EFFETTO' : 'MAGIA')}
              </span>
            </div>

            {isCreature && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#b91c1c' }}>⚔ {card.atk ?? 0}</span>
                <span style={{ color: '#15803d' }}>♥ {card.hp ?? 0}</span>
              </div>
            )}
          </div>

        </div>
      ) : combatView ? (
        /* ============================================================ */
        /* CASE 2: COMBAT VIEW (HERO BATTLEFIELD MODE)                  */
        /* ============================================================ */
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: cfg.ribbon.height * 0.7 }}>
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

            <div style={{ flex: 1, textAlign: 'right', paddingLeft: cfg.headerPl, paddingTop: 1 }}>
              <div className="tactile-title" style={{ fontSize: cfg.titleSize }}>
                {card.name || 'Carta'}
              </div>
              <div className="tactile-subtitle" style={{ fontSize: cfg.subtitleSize }}>
                {card.type || 'CREATURA'}
              </div>
            </div>
          </div>

          <div className="tactile-artwork-frame" style={{ height: cfg.artHeight }}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} />
            ) : (
              <Target style={{ width: cfg.artHeight * 0.4, height: cfg.artHeight * 0.4, color: '#6C8D88', opacity: 0.7 }} />
            )}
          </div>

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
        /* CASE 3: STANDARD FULL TACTILE CARD (1:1 REAPER FROG FIDELITY)*/
        /* ============================================================ */
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
          
          {/* Top Bar: Hanging Ribbon & Compact Title Header */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: cfg.ribbon.height * 0.7 }}>
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

          {/* Center Illustration Zone (~50% height) */}
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

          {/* Geometric 4-Tile Command Pip Bar: ─── [ ◐ ] [ ◑ ] [ ◉ ] [ ⬝ ] ─── */}
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

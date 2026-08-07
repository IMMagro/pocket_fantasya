import React from 'react';

// Preset Vector Line-Art Illustrations with custom accent color
export function CardIllustration({ illustrationKey, accentColor = '#ea580c', customImageUrl = null, className = "w-full h-full" }) {
  if (customImageUrl) {
    return (
      <div className={`relative overflow-hidden bg-[#FAF6EE] flex items-center justify-center ${className}`}>
        <img 
          src={customImageUrl} 
          alt="Card Artwork" 
          className="w-full h-full object-cover filter contrast-[1.08]"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    );
  }

  // Pre-built indie-comic illustrations
  switch (illustrationKey) {
    case 'frog_skull':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground patch with ink dots */}
          <path d="M20 135 C 70 142, 130 142, 180 135 C 160 145, 40 145, 20 135 Z" fill="#d9d0be" opacity="0.6"/>
          <circle cx="35" cy="138" r="1.5" fill="#1a1e24"/>
          <circle cx="45" cy="141" r="2" fill="#1a1e24"/>
          <circle cx="155" cy="139" r="1.5" fill="#1a1e24"/>
          <circle cx="168" cy="136" r="2" fill="#1a1e24"/>
          {/* Grass blades */}
          <path d="M28 135 L 24 120 L 32 135 M 34 135 L 36 116 L 42 135 M 165 135 L 170 118 L 174 135" stroke="#1a1e24" strokeWidth="2" strokeLinecap="round"/>
          {/* Stones */}
          <ellipse cx="60" cy="134" rx="10" ry="6" fill="#94a3b8" stroke="#1a1e24" strokeWidth="2"/>
          <ellipse cx="80" cy="136" rx="8" ry="5" fill="#64748b" stroke="#1a1e24" strokeWidth="2"/>
          <ellipse cx="145" cy="135" rx="9" ry="6" fill="#94a3b8" stroke="#1a1e24" strokeWidth="2"/>
          {/* Mushrooms */}
          <path d="M38 134 Q 40 115 42 110" stroke="#1a1e24" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 112 C 32 98, 56 98, 56 112 Z" fill={accentColor} stroke="#1a1e24" strokeWidth="2.5"/>
          <path d="M152 134 Q 155 118 158 114" stroke="#1a1e24" strokeWidth="3" strokeLinecap="round"/>
          <path d="M148 116 C 148 102, 172 102, 172 116 Z" fill={accentColor} stroke="#1a1e24" strokeWidth="2.5"/>
          {/* Skull */}
          <path d="M65 105 C 55 70, 75 42, 102 42 C 130 42, 148 70, 138 105 C 138 120, 130 134, 126 135 L 76 135 C 72 134, 65 120, 65 105 Z" fill="#F1ECE1" stroke="#1a1e24" strokeWidth="3"/>
          {/* Skull Eyes & Nose */}
          <ellipse cx="83" cy="96" rx="9" ry="14" fill="#1a1e24" transform="rotate(-6 83 96)"/>
          <ellipse cx="120" cy="96" rx="9" ry="14" fill="#1a1e24" transform="rotate(6 120 96)"/>
          <path d="M102 110 L 98 120 L 106 120 Z" fill="#1a1e24"/>
          {/* Skull Teeth */}
          <path d="M84 135 L 84 125 M 92 135 L 92 125 M 100 135 L 100 125 M 108 135 L 108 125 M 116 135 L 116 125" stroke="#1a1e24" strokeWidth="2.5"/>
          {/* Frog on Top */}
          <path d="M80 50 C 72 30, 95 18, 118 20 C 135 22, 142 35, 132 50 C 120 56, 92 56, 80 50 Z" fill={accentColor} stroke="#1a1e24" strokeWidth="3"/>
          {/* Frog Back Leg & Claws */}
          <path d="M68 62 C 60 48, 70 38, 80 44 L 62 76 L 68 84" fill="none" stroke="#1a1e24" strokeWidth="3" strokeLinecap="round"/>
          <path d="M130 44 C 142 38, 150 48, 142 62 L 146 76" fill="none" stroke="#1a1e24" strokeWidth="3" strokeLinecap="round"/>
          {/* Frog Eye */}
          <circle cx="116" cy="24" r="6" fill="#1a1e24"/>
          <circle cx="115" cy="22" r="2" fill="#FAF6EE"/>
          {/* Tongue & Mouth */}
          <path d="M132 28 Q 148 26 152 35" stroke="#ec4899" strokeWidth="4" strokeLinecap="round"/>
          {/* Back spots */}
          <ellipse cx="94" cy="32" rx="4" ry="2" fill="#FAF6EE" stroke="#1a1e24" strokeWidth="1.5"/>
          <ellipse cx="106" cy="38" rx="3" ry="1.5" fill="#FAF6EE" stroke="#1a1e24" strokeWidth="1.5"/>
        </svg>
      );

    case 'architect':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="20" width="140" height="120" rx="8" fill="#1e293b" stroke="#1a1e24" strokeWidth="3"/>
          {/* Blueprint Grid Lines */}
          <line x1="30" y1="50" x2="170" y2="50" stroke="#334155" strokeDasharray="4 4"/>
          <line x1="30" y1="80" x2="170" y2="80" stroke="#334155" strokeDasharray="4 4"/>
          <line x1="30" y1="110" x2="170" y2="110" stroke="#334155" strokeDasharray="4 4"/>
          <line x1="75" y1="20" x2="75" y2="140" stroke="#334155" strokeDasharray="4 4"/>
          <line x1="125" y1="20" x2="125" y2="140" stroke="#334155" strokeDasharray="4 4"/>
          {/* Isometric Architect Node Boxes */}
          <rect x="55" y="38" width="35" height="24" rx="4" fill={accentColor} stroke="#ffffff" strokeWidth="2"/>
          <rect x="110" y="38" width="35" height="24" rx="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="2"/>
          <rect x="82" y="85" width="40" height="28" rx="4" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>
          {/* Connecting data paths */}
          <path d="M72 62 L 72 98 L 82 98" stroke="#ffffff" strokeWidth="2.5" fill="none"/>
          <path d="M128 62 L 128 98 L 122 98" stroke="#ffffff" strokeWidth="2.5" fill="none"/>
          {/* Glowing cursor */}
          <circle cx="102" cy="99" r="4" fill="#fbbf24"/>
        </svg>
      );

    case 'fire_server':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Server Rack */}
          <rect x="55" y="30" width="90" height="105" rx="6" fill="#334155" stroke="#1a1e24" strokeWidth="3"/>
          <rect x="65" y="42" width="70" height="18" rx="3" fill="#1e293b" stroke="#1a1e24" strokeWidth="2"/>
          <rect x="65" y="68" width="70" height="18" rx="3" fill="#1e293b" stroke="#1a1e24" strokeWidth="2"/>
          <rect x="65" y="94" width="70" height="18" rx="3" fill="#1e293b" stroke="#1a1e24" strokeWidth="2"/>
          {/* LED lights */}
          <circle cx="75" cy="51" r="3" fill="#ef4444"/>
          <circle cx="85" cy="51" r="3" fill="#ef4444"/>
          <circle cx="75" cy="77" r="3" fill="#fbbf24"/>
          <circle cx="75" cy="103" r="3" fill="#ef4444"/>
          {/* Raging Fire Flames */}
          <path d="M70 120 C 50 80, 80 45, 90 20 C 100 45, 130 50, 110 90 C 135 60, 145 75, 130 120 Z" fill={accentColor} opacity="0.9"/>
          <path d="M85 120 C 75 90, 95 65, 100 45 C 105 65, 120 75, 110 120 Z" fill="#fbbf24"/>
        </svg>
      );

    case 'coffee':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Saucer */}
          <ellipse cx="100" cy="130" rx="65" ry="14" fill="#e2d8c3" stroke="#1a1e24" strokeWidth="3"/>
          {/* Cup */}
          <path d="M60 70 L 68 120 C 70 126, 130 126, 132 120 L 140 70 Z" fill="#ffffff" stroke="#1a1e24" strokeWidth="3"/>
          {/* Cup Handle */}
          <path d="M138 78 C 158 78, 158 110, 134 112" stroke="#1a1e24" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          {/* Coffee liquid surface */}
          <ellipse cx="100" cy="70" rx="39" ry="10" fill={accentColor} stroke="#1a1e24" strokeWidth="2.5"/>
          <ellipse cx="100" cy="70" rx="28" ry="6" fill="#451a03"/>
          {/* Steam Swirls */}
          <path d="M85 55 Q 75 40 90 25 Q 100 15 90 8" stroke="#1a1e24" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M110 55 Q 125 38 112 24 Q 105 14 115 8" stroke="#1a1e24" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
      );

    case 'bug':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bug Legs */}
          <path d="M65 70 L 35 55 M 60 90 L 30 90 M 65 110 L 35 125" stroke="#1a1e24" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M135 70 L 165 55 M 140 90 L 170 90 M 135 110 L 165 125" stroke="#1a1e24" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Bug Body */}
          <ellipse cx="100" cy="95" rx="35" ry="40" fill={accentColor} stroke="#1a1e24" strokeWidth="3"/>
          {/* Shell divide & spots */}
          <line x1="100" y1="60" x2="100" y2="135" stroke="#1a1e24" strokeWidth="3"/>
          <circle cx="82" cy="85" r="5" fill="#1a1e24"/>
          <circle cx="118" cy="85" r="5" fill="#1a1e24"/>
          <circle cx="85" cy="112" r="4" fill="#1a1e24"/>
          <circle cx="115" cy="112" r="4" fill="#1a1e24"/>
          {/* Head */}
          <ellipse cx="100" cy="52" rx="22" ry="16" fill="#1e293b" stroke="#1a1e24" strokeWidth="3"/>
          {/* Antennas */}
          <path d="M90 40 Q 75 22 65 20" stroke="#1a1e24" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <path d="M110 40 Q 125 22 135 20" stroke="#1a1e24" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <circle cx="65" cy="20" r="3" fill="#ef4444"/>
          <circle cx="135" cy="20" r="3" fill="#ef4444"/>
        </svg>
      );

    case 'shield_golem':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Great Shield */}
          <path d="M100 20 L 155 35 C 155 95, 130 135, 100 148 C 70 135, 45 95, 45 35 Z" fill="#1e293b" stroke="#1a1e24" strokeWidth="3.5"/>
          {/* Inner Shield Crest */}
          <path d="M100 32 L 142 45 C 142 90, 122 122, 100 134 C 78 122, 58 90, 58 45 Z" fill={accentColor} stroke="#ffffff" strokeWidth="2"/>
          {/* Lock / Rune Symbol */}
          <rect x="86" y="72" width="28" height="24" rx="4" fill="#ffffff" stroke="#1a1e24" strokeWidth="2.5"/>
          <path d="M92 72 L 92 62 C 92 56, 108 56, 108 62 L 108 72" stroke="#ffffff" strokeWidth="3" fill="none"/>
          <circle cx="100" cy="82" r="3" fill="#1a1e24"/>
        </svg>
      );

    case 'quantum_eye':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cosmic Concentric Orbit Rings */}
          <ellipse cx="100" cy="80" rx="75" ry="32" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" transform="rotate(-15 100 80)"/>
          <ellipse cx="100" cy="80" rx="75" ry="32" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" transform="rotate(15 100 80)"/>
          {/* Giant Eye Shape */}
          <path d="M40 80 Q 100 30 160 80 Q 100 130 40 80 Z" fill="#0f172a" stroke="#1a1e24" strokeWidth="3.5"/>
          <circle cx="100" cy="80" rx="28" ry="28" fill={accentColor} stroke="#ffffff" strokeWidth="2.5"/>
          <circle cx="100" cy="80" r="14" fill="#090d16"/>
          <circle cx="95" cy="74" r="5" fill="#ffffff"/>
        </svg>
      );

    case 'cat_keyboard':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Keyboard base */}
          <rect x="30" y="95" width="140" height="45" rx="5" fill="#334155" stroke="#1a1e24" strokeWidth="3"/>
          <rect x="38" y="103" width="124" height="28" rx="3" fill="#1e293b"/>
          {/* Keys rows */}
          <line x1="42" y1="112" x2="158" y2="112" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4"/>
          <line x1="42" y1="122" x2="158" y2="122" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4"/>
          {/* Sleeping Cat */}
          <ellipse cx="100" cy="82" rx="42" ry="26" fill={accentColor} stroke="#1a1e24" strokeWidth="3"/>
          {/* Head & Ears */}
          <circle cx="68" cy="72" r="18" fill={accentColor} stroke="#1a1e24" strokeWidth="3"/>
          <polygon points="56,58 64,42 70,58" fill={accentColor} stroke="#1a1e24" strokeWidth="2.5"/>
          <polygon points="72,58 80,44 84,60" fill={accentColor} stroke="#1a1e24" strokeWidth="2.5"/>
          {/* Closed Happy Eyes (Curved lines) */}
          <path d="M60 74 Q 64 78 68 74" stroke="#1a1e24" strokeWidth="2.5" fill="none"/>
          <path d="M72 74 Q 76 78 80 74" stroke="#1a1e24" strokeWidth="2.5" fill="none"/>
          {/* Tail */}
          <path d="M142 82 Q 165 70 158 55" stroke="#1a1e24" strokeWidth="4" strokeLinecap="round" fill="none"/>
        </svg>
      );

    case 'potion':
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Flask Body */}
          <path d="M88 40 L 88 55 L 55 120 C 48 135, 152 135, 145 120 L 112 55 L 112 40 Z" fill="#ffffff" opacity="0.9" stroke="#1a1e24" strokeWidth="3.5"/>
          {/* Cork */}
          <rect x="85" y="24" width="30" height="16" rx="3" fill="#b45309" stroke="#1a1e24" strokeWidth="2.5"/>
          {/* Liquid */}
          <path d="M64 105 L 55 120 C 50 132, 150 132, 145 120 L 136 105 Z" fill={accentColor}/>
          {/* Bubbles */}
          <circle cx="82" cy="115" r="4" fill="#ffffff"/>
          <circle cx="114" cy="112" r="6" fill="#ffffff"/>
          <circle cx="98" cy="95" r="3" fill="#ffffff"/>
          {/* Sparks */}
          <polygon points="100,5 104,18 116,20 106,28 108,40 98,32 88,40 92,28 82,20 95,18" fill="#fbbf24"/>
        </svg>
      );

    case 'dragon_code':
    default:
      return (
        <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dragon Head Profile */}
          <path d="M50 120 C 40 85, 60 50, 95 40 C 135 30, 160 55, 175 80 L 130 90 L 145 120 L 95 110 L 70 135 Z" fill={accentColor} stroke="#1a1e24" strokeWidth="3.5"/>
          {/* Horns */}
          <path d="M95 40 Q 80 15 60 10" stroke="#1a1e24" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <path d="M115 35 Q 110 12 95 6" stroke="#1a1e24" strokeWidth="4" strokeLinecap="round" fill="none"/>
          {/* Eye */}
          <polygon points="120,62 135,58 128,70" fill="#fbbf24" stroke="#1a1e24" strokeWidth="2"/>
          {/* Fire breath particles */}
          <circle cx="178" cy="90" r="5" fill="#ef4444"/>
          <circle cx="188" cy="85" r="3" fill="#f59e0b"/>
          <circle cx="192" cy="100" r="4" fill="#ef4444"/>
        </svg>
      );
  }
}

// Web Audio API Synthesizer for Tactile Card Game Audio Effects & Procedural Battle BGM

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ── BGM Synthesizer State ──────────────────────────────────────────────────
let bgmGainNode = null;
let bgmTimer = null;
let isBgmPlaying = false;
let isBgmMuted = false;
let isSfxMuted = false;
let bgmVolume = 0.28;
let bgmStep = 0;
let isTensionMode = false;

// Chord notes in Hz (Progression: Am -> F -> C -> G)
const CHORDS = [
  // Am
  { bass: 110.00, pad: [220.00, 261.63, 329.63], arp: [220.00, 261.63, 329.63, 440.00, 523.25, 659.25] },
  // F
  { bass: 87.31,  pad: [174.61, 220.00, 261.63], arp: [174.61, 220.00, 261.63, 349.23, 440.00, 523.25] },
  // C
  { bass: 130.81, pad: [196.00, 261.63, 329.63], arp: [196.00, 261.63, 329.63, 392.00, 523.25, 659.25] },
  // G / Em
  { bass: 98.00,  pad: [196.00, 246.94, 293.66], arp: [196.00, 246.94, 293.66, 392.00, 493.88, 587.33] }
];

function scheduleBgmBeat() {
  if (!isBgmPlaying) return;
  const ctx = getAudioContext();
  if (!ctx || !bgmGainNode) return;

  const tempo = isTensionMode ? 122 : 100; // BPM
  const beatDuration = 60 / tempo;
  const stepDuration = beatDuration / 2; // Eighth notes

  const now = ctx.currentTime;
  const chordIdx = Math.floor((bgmStep % 32) / 8);
  const stepInChord = bgmStep % 8;
  const currentChord = CHORDS[chordIdx];

  try {
    // 1. Bass Note on beat 0 and 4
    if (stepInChord === 0 || (isTensionMode && stepInChord === 4)) {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(currentChord.bass, now);
      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 1.8);
      bassOsc.connect(bassGain);
      bassGain.connect(bgmGainNode);
      bassOsc.start(now);
      bassOsc.stop(now + beatDuration * 1.8);
    }

    // 2. Pad Chords (soft warm attack on beat 0)
    if (stepInChord === 0) {
      currentChord.pad.forEach((freq) => {
        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        const padFilter = ctx.createBiquadFilter();
        
        padOsc.type = 'sawtooth';
        padOsc.frequency.setValueAtTime(freq, now);

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(isTensionMode ? 1400 : 900, now);

        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.08, now + 0.35);
        padGain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 3.8);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(bgmGainNode);

        padOsc.start(now);
        padOsc.stop(now + beatDuration * 3.8);
      });
    }

    // 3. Arpeggiated Fantasy Harp / Bell notes
    const arpNotes = currentChord.arp;
    const arpIndex = (stepInChord * 3) % arpNotes.length;
    const arpFreq = arpNotes[arpIndex];

    const arpOsc = ctx.createOscillator();
    const arpGain = ctx.createGain();
    arpOsc.type = 'sine';
    arpOsc.frequency.setValueAtTime(arpFreq, now);
    
    arpGain.gain.setValueAtTime(0, now);
    arpGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    arpGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.4);

    arpOsc.connect(arpGain);
    arpGain.connect(bgmGainNode);
    arpOsc.start(now);
    arpOsc.stop(now + stepDuration * 1.4);

    // 4. Subtle Fantasy Percussion (Kick / Taiko on 0, 4; Shaker on odd steps)
    if (stepInChord === 0 || stepInChord === 4) {
      // Warm Taiko Drum
      const drumOsc = ctx.createOscillator();
      const drumGain = ctx.createGain();
      drumOsc.type = 'sine';
      drumOsc.frequency.setValueAtTime(isTensionMode ? 110 : 85, now);
      drumOsc.frequency.exponentialRampToValueAtTime(28, now + 0.14);
      drumGain.gain.setValueAtTime(0.25, now);
      drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      drumOsc.connect(drumGain);
      drumGain.connect(bgmGainNode);
      drumOsc.start(now);
      drumOsc.stop(now + 0.16);
    } else if (stepInChord % 2 === 1 && isTensionMode) {
      // Soft Shaker for tension
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3500, now);
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.04, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      noise.connect(filter);
      filter.connect(sGain);
      sGain.connect(bgmGainNode);
      noise.start(now);
    }
  } catch (e) {
    // Audio node error safety
  }

  bgmStep = (bgmStep + 1) % 32;
  bgmTimer = setTimeout(scheduleBgmBeat, stepDuration * 1000);
}

export const soundEngine = {
  // ── Music Engine Controls ────────────────────────────────────────────────
  startBattleMusic() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (isBgmPlaying) return;

      if (!bgmGainNode) {
        bgmGainNode = ctx.createGain();
        bgmGainNode.gain.setValueAtTime(isBgmMuted ? 0 : bgmVolume, ctx.currentTime);
        bgmGainNode.connect(ctx.destination);
      } else {
        bgmGainNode.gain.setValueAtTime(isBgmMuted ? 0 : bgmVolume, ctx.currentTime);
      }

      isBgmPlaying = true;
      bgmStep = 0;
      scheduleBgmBeat();
    } catch (e) {
      console.warn('BGM start error:', e);
    }
  },

  stopBattleMusic() {
    isBgmPlaying = false;
    if (bgmTimer) {
      clearTimeout(bgmTimer);
      bgmTimer = null;
    }
    if (bgmGainNode && audioCtx) {
      try {
        bgmGainNode.gain.setValueAtTime(bgmGainNode.gain.value, audioCtx.currentTime);
        bgmGainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      } catch (e) {}
    }
  },

  setTensionMode(tension) {
    isTensionMode = !!tension;
  },

  toggleMusic() {
    isBgmMuted = !isBgmMuted;
    if (bgmGainNode && audioCtx) {
      try {
        bgmGainNode.gain.setValueAtTime(isBgmMuted ? 0 : bgmVolume, audioCtx.currentTime);
      } catch (e) {}
    }
    if (!isBgmPlaying && !isBgmMuted) {
      this.startBattleMusic();
    }
    return !isBgmMuted;
  },

  isMusicPlaying() {
    return isBgmPlaying && !isBgmMuted;
  },

  isMusicMuted() {
    return isBgmMuted;
  },

  // Volume musica 0..1 (aggiornato dal vivo dal menu di gioco)
  setMusicVolume(v) {
    bgmVolume = Math.max(0, Math.min(1, Number(v) || 0));
    if (bgmGainNode && audioCtx && !isBgmMuted) {
      try { bgmGainNode.gain.setValueAtTime(bgmVolume, audioCtx.currentTime); } catch (e) {}
    }
    return bgmVolume;
  },

  getMusicVolume() {
    return bgmVolume;
  },

  toggleSfx() {
    isSfxMuted = !isSfxMuted;
    return !isSfxMuted;
  },

  isSfxMuted() {
    return isSfxMuted;
  },

  // ── Extended Combat SFX ──────────────────────────────────────────────────

  // Sharp Blade / Sword Slash
  playSwordSlash() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. White noise blade whoosh
      const bufferSize = ctx.sampleRate * 0.16;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.14);
      filter.Q.setValueAtTime(3.5, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.35, now);
      nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(now);

      // 2. Metallic blade clink
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  },

  // Mystical Magic Cast / Spell Burst (e.g. oiraM, abilities)
  playMagicCast() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [380, 520, 780, 1100];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + idx * 0.04 + 0.2);

        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.04 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.35);
      });
    } catch (e) {}
  },

  // Direct Fire / Burn Damage (e.g. Niggastro ability)
  playDirectBurn() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.28;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.25);
      filter.Q.setValueAtTime(4.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch (e) {}
  },

  // Minion Death / Crumble Sound
  playMinionDeath() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Low impact thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  },

  // Shield Shatter / Rupture Sound
  playHeroShieldBreak() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [800, 1200, 1600].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        osc.frequency.exponentialRampToValueAtTime(120, now + idx * 0.03 + 0.18);

        gain.gain.setValueAtTime(0.25, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.2);
      });
    } catch (e) {}
  },

  // Turn Start Bell / Gong Chime
  playTurnStartChime() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [440, 880, 1320].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      });
    } catch (e) {}
  },

  // Triumphant Victory Jingle
  playVictoryJingle() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 261.63, t: 0.0,  dur: 0.15 }, // C4
        { freq: 329.63, t: 0.12, dur: 0.15 }, // E4
        { freq: 392.00, t: 0.24, dur: 0.18 }, // G4
        { freq: 523.25, t: 0.38, dur: 0.65 }  // C5 (Hold)
      ];

      notes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + t);
        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.35, now + t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + dur);
      });
    } catch (e) {}
  },

  // Somber Defeat Jingle
  playDefeatJingle() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 329.63, t: 0.0,  dur: 0.25 }, // E4
        { freq: 293.66, t: 0.22, dur: 0.25 }, // D4
        { freq: 261.63, t: 0.44, dur: 0.30 }, // C4
        { freq: 220.00, t: 0.70, dur: 0.85 }  // A3 (Low minor resolution)
      ];

      notes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + t);
        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.25, now + t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + dur);
      });
    } catch (e) {}
  },

  // ── Existing Core Sounds ─────────────────────────────────────────────────

  playPackTear() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        const envelope = Math.sin(t * Math.PI) * (1 - t * 0.5);
        data[i] = (Math.random() * 2 - 1) * envelope * (0.8 + Math.random() * 0.4);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.4);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },

  playCardFlip() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  },

  playCardPlay() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  },

  playAttack() {
    this.playSwordSlash();
  },

  playDamage() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  },

  playHeal() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.4);
      });
    } catch (e) {}
  },

  playLegendaryFanfare() {
    this.playVictoryJingle();
  },

  playLevelUp() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Sparkling ascending chord with fanfare harmonics (C5, E5, G5, C6, E6, G6)
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
      });
    } catch (e) {}
  },

  playButtonClick() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }
};

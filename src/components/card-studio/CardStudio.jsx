import React, { useState, useRef, useMemo } from 'react';
import { TactileCard, CARD_VARIANTS } from '../card/TactileCard';
import {
  Sparkles, Save, Trash2, Download, Upload, Plus, Send,
  CheckSquare, Square, CheckCircle2, AlertCircle, Copy, Image, Wand2, Palette, Crown, Move, RotateCcw,
  Scale, Zap, Swords, Heart, Shield, HelpCircle, Activity, Gauge, Flame, AlertTriangle, TrendingDown, ArrowRight, ArrowLeft, Info
} from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';
import { analyzeCardBalance, suggestOptimalStats, suggestOptimalCost } from '../../engine/cardBalanceEngine';
import { STUDIO_INSTANT_EFFECTS, STUDIO_TURN_EFFECTS } from '../../engine/effectCatalog';

// Pre-packaged authentic indie-comic illustrations
const PRESET_ILLUSTRATIONS = [
  {
    id: 'mattolone_art',
    title: '🔧 Mattolone (Tecno-Artigiano)',
    url: '/illustrations/mattolone.png',
    accentColor: '#d97706',
    defaultName: 'Mattolone',
    defaultAbilityTitle: 'CI SAREBBE DA FARE...',
    defaultAbility: 'Nascondi il portafoglio, sei il prossimo... "attitude da napoletano"',
    defaultFlavor: 'Tecno-artigiano d\'eccellenza e maestro di chiavi inglesi.'
  },
  {
    id: 'tralalero_brainrot',
    title: '🦈 Tralalero Tralala (Brainrot)',
    url: '/illustrations/tralalero_brainrot.png',
    accentColor: '#0284c7',
    defaultName: 'Tralalero Tralala',
    defaultAbilityTitle: 'DRIP MARINO',
    defaultAbility: 'Quando entra in gioco con le sue sneakers, infligge 3 danni all\'Eroe nemico e stordisce una creatura per 1 turno.',
    defaultFlavor: 'Tralalero Tralala! Lo squalo con il drip supremo che domina i mari.'
  },
  {
    id: 'void_golem',
    title: 'Void Golem & Teschio',
    url: '/illustrations/void_golem.png',
    accentColor: '#9333ea',
    defaultName: 'Void Golem',
    defaultAbilityTitle: 'VOID RESONANCE',
    defaultAbility: 'Alla fine del 3° Turno, se è ancora in campo, attiva il Caos ed infligge 4 danni a tutti i nemici.',
    defaultFlavor: 'Nato dai frammenti d\'ossidiana nel cratere abissale.'
  },
  {
    id: 'cyber_shaman_fox',
    title: 'Volpe Sciamana Cyber',
    url: '/illustrations/cyber_shaman_fox.png',
    accentColor: '#0284c7',
    defaultName: 'Volpe Mistica Cyber',
    defaultAbilityTitle: 'FLUSSO SPIRITUALE',
    defaultAbility: 'Quando entra in gioco, cura il tuo Eroe di 4 HP e pesca 1 carta.',
    defaultFlavor: 'Vede i fili invisibili che legano la magia al codice.'
  },
  {
    id: 'iron_mech_knight',
    title: 'Cavaliere Mech d\'Acciaio',
    url: '/illustrations/iron_mech_knight.png',
    accentColor: '#eab308',
    defaultName: 'Golem di Ferro Forgiato',
    defaultAbilityTitle: 'SCUDO TERRESTRE',
    defaultAbility: 'GUARDIANO: I nemici devono attaccare questo servitore prima di poter colpire il tuo Eroe.',
    defaultFlavor: 'Forgiato nei forni sotterranei della città di pietra.'
  }
];

const VARIANTS_LIST = [
  { id: 'standard', label: 'Classica Tattile', icon: '📜', desc: 'Pergamena 1:1' },
  { id: 'holo', label: 'Olografica (Holo)', icon: '✨', desc: 'Riflesso Arcobaleno' },
  { id: 'gold_foil', label: 'Gold Foil', icon: '🌟', desc: 'Laminata in Oro' },
  { id: 'full_art', label: 'Full-Art', icon: '🎨', desc: 'Senza bordi' },
  { id: 'secret_holo', label: 'Secret Rare', icon: '👑', desc: 'Full-Art + Gold + Holo' },
  { id: 'out', label: 'OUT', icon: '🌌', desc: 'Artwork esce dalla carta' }
];

// Livello di rarità di ogni variante (0 = base). Nei pacchetti la carta esce in
// una di queste finiture e per ogni livello ATK e HP aumentano di +1.
const VARIANT_LEVEL = { standard: 0, holo: 1, gold_foil: 2, full_art: 3, secret_holo: 4, out: 5 };
// Pesi di drop di default quando si abilita una variante (più alta = più rara)
const DEFAULT_VARIANT_WEIGHTS = { standard: 60, holo: 25, gold_foil: 10, full_art: 4, secret_holo: 1, out: 0.1 };

// Comprime un'immagine (data URL): ridimensiona il lato lungo a max `maxSize` px ed
// esporta in WebP (mantiene la trasparenza) con la qualità data. Riduce il peso di
// ~10-20x, così il catalogo non si gonfia e la pubblicazione non sfora i limiti.
// Se qualcosa va storto o il risultato è più grande dell'originale, torna l'originale.
function compressImageDataUrl(dataUrl, maxSize = 640, quality = 0.8) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (!width || !height) { resolve(dataUrl); return; }
          if (width > maxSize || height > maxSize) {
            const scale = maxSize / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(dataUrl); return; }
          ctx.drawImage(img, 0, 0, width, height);
          let out = canvas.toDataURL('image/webp', quality);
          // Se il browser non supporta webp ripiega su png; tieni il più piccolo tra out e originale.
          if (!out || out.indexOf('data:image/webp') !== 0) {
            out = canvas.toDataURL('image/png');
          }
          resolve(out && out.length < dataUrl.length ? out : dataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

export function CardStudio({
  cards = [],
  onSaveCard,
  onSaveMultipleCards,
  onDeleteCard,
  onDeleteMultipleCards,
  onResetAllCards,
  onPublishCards,
  onExportCards,
  onImportCards
}) {
  const [editingCard, setEditingCard] = useState({
    id: `card_${Date.now()}`,
    name: 'Mattolone',
    type: 'CREATURA',
    set: 'gli_elettronici',
    cost: 7,
    atk: 2,
    hp: 9,
    rarity: 'rare',
    variant: 'full_art',
    variantDrops: { standard: 60, holo: 25, gold_foil: 10, full_art: 4, secret_holo: 1, out: 0.1 },
    effects: {
      taunt: false,
      thorns: 0,
      divineShield: false,
      turnTriggers: [],
      conditionalCost: null,
      battlecry: [],
      deathrattle: []
    },
    fusionMaterials: [],
    accentColor: '#d97706',
    imageUrl: '/illustrations/mattolone.png',
    imageScale: 1,
    imageOffsetX: 0,
    imageOffsetY: 0,
    abilityTitle: 'CI SAREBBE DA FARE...',
    abilityText: 'Nascondi il portafoglio, sei il prossimo... "attitude da napoletano"',
    flavorText: 'Tecno-artigiano d\'eccellenza e maestro di chiavi inglesi.'
  });

  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishMsg, setPublishMsg] = useState('');
  const [aiPromptSubject, setAiPromptSubject] = useState('un potente mago oscuro con tunica ricamata su pergamena antica');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [balanceFlash, setBalanceFlash] = useState(null);

  // Analisi automatica del bilanciamento in tempo reale
  const balanceReport = useMemo(() => {
    return analyzeCardBalance(editingCard);
  }, [
    editingCard.cost,
    editingCard.atk,
    editingCard.hp,
    editingCard.type,
    editingCard.rarity,
    editingCard.abilityTitle,
    editingCard.abilityText
  ]);

  // 1-Click Auto-Bilanciamento ATK / HP
  const handleAutoBalanceStats = () => {
    soundEngine.playLevelUp();
    const { atk, hp } = suggestOptimalStats(editingCard);
    setEditingCard(prev => ({ ...prev, atk, hp }));
    setBalanceFlash('stats');
    setTimeout(() => setBalanceFlash(null), 2500);
  };

  // 1-Click Adatta Costo Mana
  const handleAutoBalanceCost = () => {
    soundEngine.playLevelUp();
    const cost = suggestOptimalCost(editingCard);
    setEditingCard(prev => ({ ...prev, cost }));
    setBalanceFlash('cost');
    setTimeout(() => setBalanceFlash(null), 2500);
  };

  // Trascinamento immagine nel riquadro di inquadratura
  const framerRef = useRef(null);
  const [imgDrag, setImgDrag] = useState(null);

  const resetImageFraming = () => {
    soundEngine.playButtonClick();
    setEditingCard(prev => ({ ...prev, imageScale: 1, imageOffsetX: 0, imageOffsetY: 0 }));
  };

  // Varianti nei pacchetti: abilita/disabilita (spuntina) e imposta la percentuale
  const toggleVariantDrop = (variantId) => {
    soundEngine.playButtonClick();
    setEditingCard(prev => {
      const drops = { ...(prev.variantDrops || {}) };
      if (drops[variantId] != null) {
        delete drops[variantId];
      } else {
        drops[variantId] = DEFAULT_VARIANT_WEIGHTS[variantId] ?? 10;
      }
      // Deve restare abilitata almeno una variante
      if (Object.keys(drops).length === 0) drops[variantId] = 100;
      // Se la finitura in anteprima non è più abilitata, spostala su una valida
      const nextVariant = drops[prev.variant] != null ? prev.variant : Object.keys(drops)[0];
      return { ...prev, variantDrops: drops, variant: nextVariant };
    });
  };
  const setVariantDropPercent = (variantId, value) => {
    setEditingCard(prev => ({
      ...prev,
      variantDrops: { ...(prev.variantDrops || {}), [variantId]: Math.max(0, Math.min(100, value)) }
    }));
  };

  // Genera nel catalogo una carta separata per ogni variante spuntata, con
  // boost statistiche (+livello) e peso di drop = percentuale impostata.
  // Ogni copia è modificabile singolarmente (design, immagine, testo).
  const [variantGenStatus, setVariantGenStatus] = useState(null);
  const generateVariantCopies = () => {
    const drops = editingCard.variantDrops || {};
    const enabled = VARIANTS_LIST.filter(v => drops[v.id] != null);
    if (enabled.length === 0) { alert('Spunta almeno una variante da generare.'); return; }
    if (!editingCard.name.trim()) { alert('Inserisci un nome per la carta!'); return; }

    soundEngine.playLegendaryFanfare();
    const baseName = editingCard.name.replace(/\s+·\s+.*$/, '').trim();
    const baseAtk = parseInt(editingCard.atk) || 0;
    const baseHp = parseInt(editingCard.hp) || 0;
    const baseId = editingCard.baseId || editingCard.id || `card_${Date.now()}`;

    const copies = enabled.map(v => {
      const level = VARIANT_LEVEL[v.id] || 0;
      return {
        ...editingCard,
        id: `${baseId}__${v.id}`,
        baseId,
        name: baseName,
        variant: v.id,
        variantLevel: level,
        dropWeight: drops[v.id],
        atk: baseAtk,
        hp: baseHp,
      };
    });

    if (onSaveMultipleCards) onSaveMultipleCards(copies);
    else copies.forEach(c => onSaveCard(c));
    setVariantGenStatus({ count: copies.length });
    setTimeout(() => setVariantGenStatus(null), 4000);
  };
  const onFramerPointerDown = (e) => {
    if (!editingCard.imageUrl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setImgDrag({ startX: e.clientX, startY: e.clientY, baseX: editingCard.imageOffsetX || 0, baseY: editingCard.imageOffsetY || 0 });
  };
  const onFramerPointerMove = (e) => {
    if (!imgDrag || !framerRef.current) return;
    const rect = framerRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - imgDrag.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - imgDrag.startY) / rect.height) * 100;
    const nx = Math.max(-100, Math.min(100, Math.round(imgDrag.baseX + dxPct)));
    const ny = Math.max(-100, Math.min(100, Math.round(imgDrag.baseY + dyPct)));
    setEditingCard(prev => ({ ...prev, imageOffsetX: nx, imageOffsetY: ny }));
  };
  const onFramerPointerUp = () => setImgDrag(null);

  const handleInputChange = (field, value) => {
    setEditingCard(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNew = () => {
    soundEngine.playButtonClick();
    setEditingCard({
      id: `card_${Date.now()}`,
      name: 'Nuova Carta',
      type: 'CREATURA',
      set: 'gli_elettronici',
      cost: 3,
      atk: 3,
      hp: 4,
      rarity: 'rare',
      variant: 'standard',
      variantDrops: { standard: 100 },
      effects: {
        taunt: false,
        thorns: 0,
        divineShield: false,
        turnTriggers: [],
        conditionalCost: null,
        battlecry: [],
        deathrattle: []
      },
      fusionMaterials: [],
      accentColor: '#2563eb',
      imageUrl: '/illustrations/tralalero_brainrot.png',
      imageScale: 1,
      imageOffsetX: 0,
      imageOffsetY: 0,
      abilityTitle: 'POTERE MISTICO',
      abilityText: 'Quando questa creatura scende in campo, genera un effetto tattico.',
      flavorText: 'Una leggenda scritta nelle cronache antiche.'
    });
  };

  const handleSelectPreset = (preset) => {
    soundEngine.playCardFlip();
    setEditingCard(prev => ({
      ...prev,
      name: preset.defaultName || prev.name,
      imageUrl: preset.url,
      imageScale: 1,
      imageOffsetX: 0,
      imageOffsetY: 0,
      accentColor: preset.accentColor,
      abilityTitle: preset.defaultAbilityTitle || prev.abilityTitle,
      abilityText: preset.defaultAbility || prev.abilityText,
      flavorText: preset.defaultFlavor || prev.flavorText
    }));
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    soundEngine.playButtonClick();
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      // Comprime l'immagine prima di salvarla: evita cataloghi enormi e errori di
      // pubblicazione (payload troppo grande). Se la compressione fallisce, usa l'originale.
      const compressed = await compressImageDataUrl(uploadEvent.target.result);
      setEditingCard(prev => ({
        ...prev,
        imageUrl: compressed,
        imageScale: 1,
        imageOffsetX: 0,
        imageOffsetY: 0
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editingCard.name.trim()) {
      alert('Inserisci un nome per la carta!');
      return;
    }

    soundEngine.playCardFlip();
    onSaveCard(editingCard);
    
    // Feedback sonoro fanfare per carte di alto rango
    if (editingCard.rarity === 'legendary' || editingCard.rarity === 'mythic' || editingCard.variant === 'full_art' || editingCard.variant === 'secret_holo' || editingCard.variant === 'out') {
      soundEngine.playLegendaryFanfare();
    }
  };

  const handleCopyAiPrompt = () => {
    const fullPrompt = `Vintage tactile indie comic illustration of ${aiPromptSubject}, ink lines, warm textured ivory parchment background #FAF7EE, muted teal #6C8D88 accents, risograph print texture, dark fantasy storybook character style, sharp outlines, highly detailed character concept art, clean transparent background, centered composition --ar 3:4 --v 6.0`;
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    soundEngine.playButtonClick();
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleToggleSelectCard = (id, e) => {
    e.stopPropagation();
    soundEngine.playButtonClick();
    const updated = new Set(selectedCardIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedCardIds(updated);
  };

  const handleToggleSelectAll = () => {
    soundEngine.playButtonClick();
    if (selectedCardIds.size === cards.length) {
      setSelectedCardIds(new Set());
    } else {
      setSelectedCardIds(new Set(cards.map(c => c.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCardIds.size === 0) return;
    if (window.confirm(`Sei sicuro di voler eliminare ${selectedCardIds.size} carte selezionate?`)) {
      soundEngine.playDamage();
      if (onDeleteMultipleCards) {
        onDeleteMultipleCards(Array.from(selectedCardIds));
      } else {
        selectedCardIds.forEach(id => onDeleteCard(id));
      }
      setSelectedCardIds(new Set());
    }
  };

  const handlePublishToServer = async () => {
    soundEngine.playLegendaryFanfare();
    setPublishStatus('publishing');
    setPublishMsg('');
    try {
      let result;
      if (onPublishCards) {
        result = await onPublishCards(cards);
      } else {
        const res = await fetch('http://localhost:4000/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards })
        });
        result = { ok: res.ok, status: res.status };
      }

      if (result && result.ok) {
        setPublishStatus('success');
        setTimeout(() => setPublishStatus(null), 4000);
      } else {
        // Pubblicazione fallita ma il lavoro è comunque salvato in locale.
        const msg = result?.status === 413
          ? 'Immagini troppo pesanti per il server. Le carte sono al sicuro in locale: le nuove immagini vengono compresse automaticamente, riprova a pubblicare.'
          : result?.networkError
          ? 'Server non raggiungibile (porta 4000). Le carte sono salvate in locale: avvia il backend con "npm run server" e ripubblica.'
          : `Il server ha rifiutato la pubblicazione${result?.status ? ` (codice ${result.status})` : ''}. Le carte sono salvate in locale.`;
        setPublishMsg(msg);
        setPublishStatus('error');
        setTimeout(() => setPublishStatus(null), 7000);
      }
    } catch (err) {
      console.error('Publish error:', err);
      setPublishMsg('Errore imprevisto durante la pubblicazione. Le carte restano salvate in locale, riprova.');
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(null), 7000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Banner: Creator Studio Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131922] p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
              👑 Studio Creatore Esclusivo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-100 flex items-center gap-2.5 mt-1">
            <Sparkles className="w-7 h-7 text-amber-400" />
            Card Studio: Creazione Carte Full-Art & Varianti Tattili
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            Crea carte pergamena vintage standard, versioni Full-Art a tutto schermo, finiture Holo e Gold Foil per il gioco.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 transition shadow-sm hover:border-amber-400"
          >
            <ArrowLeft className="w-4 h-4" /> Torna al Gioco
          </a>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Nuova Carta
          </button>

          <button
            onClick={onExportCards}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-sky-400" /> Esporta Backup
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" /> Carica Set
            <input type="file" accept=".json" onChange={onImportCards} className="hidden" />
          </label>

          {/* MAIN PUBLISH BUTTON */}
          <button
            onClick={handlePublishToServer}
            disabled={publishStatus === 'publishing'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
              publishStatus === 'publishing'
                ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-amber-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
            {publishStatus === 'publishing' ? 'Sincronizzazione in corso...' : 'Pubblica Carte Live (Porta 4000)'}
          </button>
        </div>
      </div>

      {/* Publish Toast */}
      {publishStatus === 'success' && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 p-4 rounded-xl flex items-center justify-between text-sm shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-bold">Catalogo sincronizzato con successo!</p>
              <p className="text-xs text-emerald-400/80">Tutti i mazzi, i pacchetti e i giocatori in partita vedranno le nuove carte istantaneamente.</p>
            </div>
          </div>
        </div>
      )}

      {publishStatus === 'error' && (
        <div className="bg-rose-950/80 border border-rose-500 text-rose-300 p-4 rounded-xl flex items-center justify-between text-sm shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-bold">Pubblicazione non riuscita — carte al sicuro in locale</p>
              <p className="text-xs text-rose-400/80">{publishMsg || 'Riprova, oppure assicurati che il backend sia avviato con `npm run server`.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Editing Tools & Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#131922] p-5 md:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          
          {/* SECTION: Finitura & Stile Grafico (Full-Art / Holo / Foil) */}
          <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4" /> Variante Grafica & Finitura Speciale
              </span>
              <span className="text-[11px] text-slate-400">
                Seleziona la finitura visiva della carta
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {VARIANTS_LIST.map((v) => {
                const isActive = (editingCard.variant || 'standard') === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playCardFlip();
                      handleInputChange('variant', v.id);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      isActive 
                        ? 'bg-amber-500/20 border-amber-400 shadow-glow-amber text-amber-300' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl mb-1">{v.icon}</span>
                    <span className="text-[11px] font-bold leading-tight">{v.label}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION: Varianti nei Pacchetti (spuntine + percentuali + boost) */}
          <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> Varianti nei Pacchetti & Probabilità
              </span>
              <span className="text-[11px] text-slate-400">Spunta le varianti che possono uscire</span>
            </div>

            <div className="space-y-1.5">
              {VARIANTS_LIST.map((v) => {
                const drops = editingCard.variantDrops || {};
                const enabled = drops[v.id] != null;
                const level = VARIANT_LEVEL[v.id] || 0;
                const weight = drops[v.id] ?? 0;
                const totalW = Object.values(drops).reduce((s, w) => s + (w || 0), 0) || 1;
                const effPct = enabled ? Math.round((weight / totalW) * 100) : 0;
                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition ${
                      enabled ? 'bg-slate-950/60 border-amber-500/30' : 'bg-slate-950/30 border-slate-800'
                    }`}
                  >
                    <button type="button" onClick={() => toggleVariantDrop(v.id)} className="flex-shrink-0 transition hover:scale-110">
                      {enabled
                        ? <CheckSquare className="w-5 h-5 text-amber-400" />
                        : <Square className="w-5 h-5 text-slate-500" />}
                    </button>
                    <span className="text-base flex-shrink-0">{v.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold truncate ${enabled ? 'text-slate-100' : 'text-slate-500'}`}>{v.label}</div>
                      <div className="text-[10px] text-slate-400">
                        {level === 0 ? 'Finitura base' : 'Solo estetica · stesse statistiche'}
                      </div>
                    </div>
                    {enabled ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number" min="0" max="100" value={weight}
                          onChange={(e) => setVariantDropPercent(v.id, parseInt(e.target.value) || 0)}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono text-center focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-amber-300/80 font-mono w-9 text-right">{effPct}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 w-[92px] text-right">disattivata</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Il peso è la probabilità di drop nei pacchetti (normalizzata, a destra). Le varianti superiori sono più rare e più forti (<span className="text-emerald-400">+1/+1 per livello</span>).
            </p>

            <button
              type="button"
              onClick={generateVariantCopies}
              className="w-full mt-1 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <Crown className="w-4 h-4" /> Genera Varianti nel Catalogo
            </button>
            {variantGenStatus && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/50 border border-emerald-600/40 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                Create/aggiornate {variantGenStatus.count} carte nel catalogo. Cliccale in fondo per lavorare sul design di ognuna.
              </div>
            )}
          </div>

          {/* Section: Choose / Upload Illustration */}
          <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-sky-400" /> Illustrazione Carta
              </label>
              
              <label className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" /> Carica dal tuo PC
                <input type="file" accept="image/*" onChange={handleCustomImageUpload} className="hidden" />
              </label>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESET_ILLUSTRATIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition ${
                    editingCard.imageUrl === preset.url
                      ? 'bg-amber-500/20 border-amber-400 shadow-glow-amber'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={preset.url} alt={preset.title} className="w-12 h-12 object-contain rounded-md" />
                  <span className="text-[10px] font-semibold text-slate-300 leading-tight">
                    {preset.title.split(' ')[1] || preset.title}
                  </span>
                </button>
              ))}
            </div>

            {/* AI Prompt Generator Assistant */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" /> Generatore Prompt per AI (Midjourney / Imagen)
                </span>
                <button
                  type="button"
                  onClick={handleCopyAiPrompt}
                  className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1"
                >
                  {copiedPrompt ? (
                    <><CheckSquare className="w-3 h-3 text-emerald-400" /> Copiato!</>
                  ) : (
                    <><Copy className="w-3 h-3 text-amber-400" /> Copia Prompt</>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={aiPromptSubject}
                onChange={(e) => setAiPromptSubject(e.target.value)}
                placeholder="Es: un drago meccanico con occhi rossi su rovine di pietra..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-sans"
              />
            </div>

          </div>

          {/* Section: Image Framing (Zoom + Position) */}
          <div className="space-y-2.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Move className="w-4 h-4 text-emerald-400" /> Inquadratura Immagine
              </label>
              <button
                type="button"
                onClick={resetImageFraming}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" /> Reset
              </button>
            </div>

            <div className="flex gap-4 items-stretch">
              {/* Draggable framing box */}
              <div
                ref={framerRef}
                onPointerDown={onFramerPointerDown}
                onPointerMove={onFramerPointerMove}
                onPointerUp={onFramerPointerUp}
                onPointerLeave={onFramerPointerUp}
                className="tactile-paper"
                style={{
                  width: 190, height: 140, flexShrink: 0, borderRadius: 10,
                  overflow: 'hidden', position: 'relative',
                  cursor: editingCard.imageUrl ? (imgDrag ? 'grabbing' : 'grab') : 'default',
                  touchAction: 'none', border: '1px solid #D1C9B8',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
                }}
              >
                {editingCard.imageUrl ? (
                  <img
                    src={editingCard.imageUrl}
                    alt="anteprima inquadratura"
                    draggable={false}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'contain', objectPosition: 'center bottom',
                      transform: `translate(${editingCard.imageOffsetX || 0}%, ${editingCard.imageOffsetY || 0}%) scale(${editingCard.imageScale ?? 1})`,
                      transformOrigin: 'center center',
                      transition: imgDrag ? 'none' : 'transform 0.12s ease',
                      userSelect: 'none', pointerEvents: 'none',
                      filter: 'drop-shadow(0 4px 8px rgba(25,37,35,0.16))'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 text-center px-3">
                    Carica o scegli un'immagine
                  </div>
                )}
                {/* guida cornice */}
                <div style={{ position: 'absolute', inset: 6, border: '1px dashed rgba(108,141,136,0.45)', borderRadius: 6, pointerEvents: 'none' }} />
              </div>

              {/* Zoom slider column */}
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Zoom</span>
                  <span className="font-mono text-slate-200">{Math.round((editingCard.imageScale ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range" min="0.5" max="3" step="0.05"
                  value={editingCard.imageScale ?? 1}
                  onChange={(e) => handleInputChange('imageScale', parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-500 leading-snug">
                  Trascina l'immagine nel riquadro per posizionarla, usa lo slider per ingrandirla o rimpicciolirla. L'anteprima della carta si aggiorna in tempo reale.
                </p>
              </div>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Card Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Titolo Carta
              </label>
              <input
                type="text"
                value={editingCard.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Cost */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Costo Mana (Nastro a Sx)
                </label>
                {balanceReport.suggestedCost !== editingCard.cost && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    Consigliato: {balanceReport.suggestedCost}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                max="10"
                value={editingCard.cost}
                onChange={(e) => handleInputChange('cost', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Attack */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Forza Attacco (ATK)
                </label>
                {balanceReport.suggestedAtk !== editingCard.atk && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Target: {balanceReport.suggestedAtk}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                max="30"
                value={editingCard.atk}
                onChange={(e) => handleInputChange('atk', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* HP */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Punti Vita (HP)
                </label>
                {balanceReport.suggestedHp !== editingCard.hp && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Target: {balanceReport.suggestedHp}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={editingCard.hp}
                onChange={(e) => handleInputChange('hp', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Set (Espansione) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Espansione (Set)
              </label>
              <select
                value={editingCard.set || 'gli_elettronici'}
                onChange={(e) => handleInputChange('set', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="gli_elettronici">Gli Elettronici (Base)</option>
                <option value="promo">Promo / Speciale</option>
              </select>
            </div>

            {/* Rarity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Rarità Base Carta
              </label>
              <select
                value={editingCard.rarity}
                onChange={(e) => handleInputChange('rarity', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="common">Comune</option>
                <option value="rare">Rara (+0.5 pt bonus)</option>
                <option value="epic">Epica (+1.0 pt bonus)</option>
                <option value="legendary">Leggendaria (+1.5 pt bonus)</option>
                <option value="mythic">Mitica (+2.0 pt bonus)</option>
              </select>
            </div>

            {/* Ability Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Parola Chiave Abilità (Es: CI SAREBBE DA FARE...)
              </label>
              <input
                type="text"
                value={editingCard.abilityTitle || ''}
                onChange={(e) => handleInputChange('abilityTitle', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>

          </div>

          {/* Ability Text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Descrizione Narrativa (Per il giocatore e l'analizzatore di bilanciamento)
            </label>
            <textarea
              rows="2"
              value={editingCard.abilityText}
              onChange={(e) => handleInputChange('abilityText', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Flavor Text */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Citazione / Lore Narrativo in Corsivo
            </label>
            <input
              type="text"
              value={editingCard.flavorText}
              onChange={(e) => handleInputChange('flavorText', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400 italic focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Editor Effetti a Flag (Fase D esteso) */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              Configurazione Effetti Logici (FLAG)
            </label>
            
            {/* Passivi base */}
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={editingCard.effects?.taunt || false}
                  onChange={(e) => handleInputChange('effects', { ...(editingCard.effects || {}), taunt: e.target.checked })}
                  className="accent-amber-500"
                />
                🛡️ Guardiano
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={editingCard.effects?.divineShield || false}
                  onChange={(e) => handleInputChange('effects', { ...(editingCard.effects || {}), divineShield: e.target.checked })}
                  className="accent-amber-500"
                />
                ✨ Scudo Divino
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer" title="Danni inflitti a chi attacca questa carta">
                🗡️ Spine
                <input 
                  type="number"
                  min="0"
                  value={editingCard.effects?.thorns || 0}
                  onChange={(e) => handleInputChange('effects', { ...(editingCard.effects || {}), thorns: parseInt(e.target.value) || 0 })}
                  className="w-12 bg-slate-800 text-xs p-1 ml-1 rounded border border-slate-600 text-center text-slate-200"
                />
              </label>
            </div>

            {/* Battlecry */}
            <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-slate-700/50">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Battlecry (Quando entra in gioco)</label>
              <button 
                type="button"
                onClick={() => {
                  const currentEffects = editingCard.effects || {};
                  const newBc = [...(currentEffects.battlecry || []), { type: 'hero_damage', value: 2 }];
                  handleInputChange('effects', { ...currentEffects, battlecry: newBc });
                }}
                className="text-xs bg-slate-800 border border-slate-600 px-2 py-1 rounded w-max hover:bg-slate-700 text-slate-200"
              >
                + Aggiungi Effetto Entrata
              </button>
              {(editingCard.effects?.battlecry || []).map((bc, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded flex-wrap">
                   <select 
                    value={bc.type} 
                    onChange={(e) => {
                      const newBc = [...editingCard.effects.battlecry];
                      newBc[idx].type = e.target.value;
                      if(e.target.value === 'summon_token') newBc[idx].tokenName = cards[0]?.name || '';
                      handleInputChange('effects', { ...editingCard.effects, battlecry: newBc });
                    }}
                    className="bg-slate-800 text-xs p-1 rounded border border-slate-600 text-slate-200"
                   >
                     {STUDIO_INSTANT_EFFECTS.map(ef => (
                       <option key={ef.id} value={ef.id}>{ef.label}</option>
                     ))}
                   </select>
                   
                   {bc.type === 'summon_token' ? (
                     <select
                       value={bc.tokenName || ''}
                       onChange={(e) => {
                         const newBc = [...editingCard.effects.battlecry];
                         newBc[idx].tokenName = e.target.value;
                         handleInputChange('effects', { ...editingCard.effects, battlecry: newBc });
                       }}
                       className="bg-slate-800 text-xs p-1 rounded border border-slate-600 text-slate-200 max-w-[150px]"
                     >
                       <option value="">-- Seleziona --</option>
                       <option value="cliente_insoddisfatta">Cliente Insoddisfatta (Token)</option>
                       {cards.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                   ) : null}

                   <span className="text-[10px] text-slate-400 ml-1">{bc.type === 'summon_token' ? 'Quantità:' : 'Valore:'}</span>
                   <input 
                    type="number" 
                    value={bc.value || bc.count || 1} 
                    onChange={(e) => {
                      const newBc = [...editingCard.effects.battlecry];
                      const val = parseInt(e.target.value) || 0;
                      if (bc.type === 'summon_token') newBc[idx].count = val;
                      else newBc[idx].value = val;
                      handleInputChange('effects', { ...editingCard.effects, battlecry: newBc });
                    }}
                    className="w-16 bg-slate-800 text-xs p-1 rounded border border-slate-600 text-center text-slate-200"
                   />
                   <button
                    onClick={() => {
                      const newBc = [...editingCard.effects.battlecry];
                      newBc.splice(idx, 1);
                      handleInputChange('effects', { ...editingCard.effects, battlecry: newBc });
                    }}
                    className="text-rose-500 hover:text-rose-300 p-1 ml-auto"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>

            {/* Turn Triggers */}
            <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-slate-700/50">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Effetti di Turno (Es. Danno a turno)</label>
              <button 
                type="button"
                onClick={() => {
                  const currentEffects = editingCard.effects || {};
                  const newTt = [...(currentEffects.turnTriggers || []), { type: 'hero_burn', value: 1 }];
                  handleInputChange('effects', { ...currentEffects, turnTriggers: newTt });
                }}
                className="text-xs bg-slate-800 border border-slate-600 px-2 py-1 rounded w-max hover:bg-slate-700 text-slate-200"
              >
                + Aggiungi Effetto di Turno
              </button>
              {(editingCard.effects?.turnTriggers || []).map((tt, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded flex-wrap">
                   <select 
                    value={tt.type} 
                    onChange={(e) => {
                      const newTt = [...editingCard.effects.turnTriggers];
                      newTt[idx].type = e.target.value;
                      if(e.target.value === 'spawn_token') newTt[idx].tokenName = cards[0]?.name || '';
                      handleInputChange('effects', { ...editingCard.effects, turnTriggers: newTt });
                    }}
                    className="bg-slate-800 text-xs p-1 rounded border border-slate-600 text-slate-200"
                   >
                     {STUDIO_TURN_EFFECTS.map(ef => (
                       <option key={ef.id} value={ef.id}>{ef.label}</option>
                     ))}
                   </select>

                   {tt.type === 'spawn_token' ? (
                     <select
                       value={tt.tokenName || ''}
                       onChange={(e) => {
                         const newTt = [...editingCard.effects.turnTriggers];
                         newTt[idx].tokenName = e.target.value;
                         handleInputChange('effects', { ...editingCard.effects, turnTriggers: newTt });
                       }}
                       className="bg-slate-800 text-xs p-1 rounded border border-slate-600 text-slate-200 max-w-[150px]"
                     >
                       <option value="">-- Seleziona --</option>
                       <option value="cliente_insoddisfatta">Cliente Insoddisfatta (Token)</option>
                       {cards.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                   ) : null}

                   <span className="text-[10px] text-slate-400 ml-1">{tt.type === 'spawn_token' ? 'Quantità:' : 'Danni:'}</span>
                   <input 
                    type="number" 
                    value={tt.value || tt.count || 1} 
                    onChange={(e) => {
                      const newTt = [...editingCard.effects.turnTriggers];
                      const val = parseInt(e.target.value) || 0;
                      if (tt.type === 'spawn_token') newTt[idx].count = val;
                      else newTt[idx].value = val;
                      handleInputChange('effects', { ...editingCard.effects, turnTriggers: newTt });
                    }}
                    className="w-16 bg-slate-800 text-xs p-1 rounded border border-slate-600 text-center text-slate-200"
                   />
                   <button
                    onClick={() => {
                      const newTt = [...editingCard.effects.turnTriggers];
                      newTt.splice(idx, 1);
                      handleInputChange('effects', { ...editingCard.effects, turnTriggers: newTt });
                    }}
                    className="text-rose-500 hover:text-rose-300 p-1 ml-auto"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>

            {/* Conditional Cost */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Costo Mana Condizionale</label>
              <div className="flex gap-2 items-center bg-black/20 p-2 rounded">
                 <input 
                  type="checkbox"
                  checked={!!editingCard.effects?.conditionalCost}
                  onChange={(e) => {
                    const currentEffects = editingCard.effects || {};
                    if (e.target.checked) {
                      handleInputChange('effects', { ...currentEffects, conditionalCost: { hpThresholdPercent: 0.5, newCost: 5 } });
                    } else {
                      handleInputChange('effects', { ...currentEffects, conditionalCost: null });
                    }
                  }}
                  className="accent-amber-500"
                 />
                 <span className="text-xs text-slate-200">Sconto se HP bassi</span>
                 
                 {editingCard.effects?.conditionalCost && (
                   <div className="flex gap-2 items-center ml-2 border-l border-slate-600 pl-2">
                     <span className="text-xs text-slate-300 ml-2">Se HP &le;</span>
                     <select
                       value={editingCard.effects.conditionalCost.hpThresholdPercent}
                       onChange={(e) => {
                         const cost = { ...editingCard.effects.conditionalCost, hpThresholdPercent: parseFloat(e.target.value) };
                         handleInputChange('effects', { ...editingCard.effects, conditionalCost: cost });
                       }}
                       className="bg-slate-800 text-xs p-1 rounded border border-slate-600 text-slate-200"
                     >
                       <option value={0.75}>75%</option>
                       <option value={0.5}>50%</option>
                       <option value={0.25}>25%</option>
                     </select>
                     <span className="text-xs text-slate-300">Costo =</span>
                     <input
                       type="number"
                       value={editingCard.effects.conditionalCost.newCost}
                       onChange={(e) => {
                         const cost = { ...editingCard.effects.conditionalCost, newCost: parseInt(e.target.value) || 0 };
                         handleInputChange('effects', { ...editingCard.effects, conditionalCost: cost });
                       }}
                       className="w-12 bg-slate-800 text-xs p-1 rounded border border-slate-600 text-center text-slate-200"
                     />
                   </div>
                 )}
              </div>
            </div>

          </div>

          {/* Editor Fusione (Fase G — stile Yu-Gi-Oh) */}
          <div className="bg-gradient-to-br from-[#160f22] via-[#1a1327] to-[#201430] p-4 md:p-5 rounded-2xl border border-fuchsia-700/50 shadow-2xl space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-fuchsia-300 flex items-center gap-2">
              ⚗️ Carta Fusione
              <span className="text-[10px] font-normal text-slate-400 normal-case">
                Definisce 2 componenti: se il giocatore ha entrambe le creature in campo può fonderle per evocare questa carta.
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={(editingCard.fusionMaterials || []).length === 2}
                onChange={(e) => {
                  handleInputChange('fusionMaterials', e.target.checked ? ['', ''] : []);
                }}
              />
              Questa è una carta fusione
            </label>
            {(editingCard.fusionMaterials || []).length === 2 && (
              <div className="flex flex-wrap items-center gap-2">
                {[0, 1].map(mi => (
                  <select
                    key={mi}
                    value={editingCard.fusionMaterials[mi] || ''}
                    onChange={(e) => {
                      const mats = [...(editingCard.fusionMaterials || ['', ''])];
                      mats[mi] = e.target.value;
                      handleInputChange('fusionMaterials', mats);
                    }}
                    className="bg-slate-800 text-xs p-2 rounded border border-fuchsia-600/50 text-slate-200 max-w-[200px]"
                  >
                    <option value="">-- Componente {mi + 1} --</option>
                    {Array.from(new Map(cards.map(c => [String(c.name || '').split('·')[0].trim(), c])).values())
                      .map(c => {
                        const base = String(c.name || '').split('·')[0].trim();
                        return <option key={c.id} value={base}>{base}</option>;
                      })}
                  </select>
                ))}
                <span className="text-[10px] text-fuchsia-300/70">
                  I componenti sono confrontati per nome base (senza variante).
                </span>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════ */}
          {/* ⚖️ CARD BALANCE STUDIO PANEL (Real-time Vanilla Test & Mana Budget Meter) */}
          {/* ═════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-[#0c1322] via-[#111927] to-[#141e30] p-4 md:p-5 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4">
            
            {/* Header: Title + Dynamic Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    Bilanciamento Automatico TCG
                    <span className="text-[10px] font-normal text-slate-400 font-mono">(Vanilla Test Standard)</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Valuta in tempo reale Mana, Statistiche ed Effetti speciali scritti nel testo.
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm transition-all"
                style={{
                  backgroundColor: `${balanceReport.statusColor}18`,
                  borderColor: `${balanceReport.statusColor}55`,
                  color: balanceReport.statusColor
                }}
              >
                <span className="text-sm">{balanceReport.statusIcon}</span>
                <span>{balanceReport.balanceRatio}% · {balanceReport.statusLabel}</span>
              </div>
            </div>

            {/* Visual Balance Gauge (Multi-Zone Meter) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Indicatore di Potere</span>
                <span className="font-mono text-slate-200">
                  Punti: <strong className="text-amber-300">{balanceReport.powerScore}</strong> / Budget Ideale: <strong className="text-emerald-300">{balanceReport.targetBudget}</strong>
                </span>
              </div>

              {/* Progress Track */}
              <div className="relative h-4 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden p-0.5 shadow-inner">
                {/* 4 Colored Zones */}
                <div className="absolute inset-0 flex">
                  {/* Underpowered: 0-40% of track (= 0-80% ratio) */}
                  <div className="w-[40%] bg-gradient-to-r from-sky-600/40 to-sky-500/40 border-r border-sky-400/30" />
                  {/* Balanced: 40-57.5% of track (= 80-115% ratio) */}
                  <div className="w-[17.5%] bg-gradient-to-r from-emerald-600/60 to-emerald-500/60 border-r border-emerald-400/40" />
                  {/* Strong: 57.5-67.5% of track (= 116-135% ratio) */}
                  <div className="w-[10%] bg-gradient-to-r from-amber-600/60 to-amber-500/60 border-r border-amber-400/40" />
                  {/* Overpowered: 67.5-100% of track (= >135% ratio) */}
                  <div className="w-[32.5%] bg-gradient-to-r from-rose-600/60 to-rose-500/70" />
                </div>

                {/* Animated Needle Marker */}
                <div
                  className="absolute top-0 bottom-0 w-2 -ml-1 bg-white rounded-full shadow-[0_0_10px_#ffffff] transition-all duration-300 ease-out z-10"
                  style={{
                    left: `${Math.max(2, Math.min(98, (balanceReport.balanceRatio / 200) * 100))}%`
                  }}
                />
              </div>

              {/* Zone Labels */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span className="text-sky-400 font-semibold">📉 Debole (&lt;80%)</span>
                <span className="text-emerald-400 font-semibold">⚖️ Bilanciata (80-115%)</span>
                <span className="text-amber-400 font-semibold">⚠️ Forte (116-135%)</span>
                <span className="text-rose-400 font-semibold">🔥 OP (&gt;135%)</span>
              </div>
            </div>

            {/* Breakdown Grid: Transparent Math */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              
              {/* Stat Points */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Swords className="w-3 h-3 text-amber-400" /> Stats Base
                </div>
                <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                  +{balanceReport.statPoints} <span className="text-[10px] text-slate-400 font-normal">({editingCard.atk} + {editingCard.hp})</span>
                </div>
              </div>

              {/* Effects Points */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Effetti Rilevati
                </div>
                <div className="text-sm font-mono font-bold text-purple-300 mt-0.5">
                  +{balanceReport.effectsPoints.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">pt</span>
                </div>
              </div>

              {/* Rarity Discount */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Bonus Rarità
                </div>
                <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                  -{balanceReport.rarityBonus} <span className="text-[10px] text-slate-400 font-normal">({editingCard.rarity})</span>
                </div>
              </div>

              {/* Target Budget */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-400" /> Budget Mana
                </div>
                <div className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
                  {balanceReport.targetBudget} <span className="text-[10px] text-slate-400 font-normal">(per {editingCard.cost} Mana)</span>
                </div>
              </div>

            </div>

            {/* Detected Effects Badges List */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Effetti Speciali Riconosciuti nel Testo:
              </div>
              {balanceReport.detectedEffects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {balanceReport.detectedEffects.map(eff => (
                    <div
                      key={eff.id}
                      title={eff.description}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-semibold"
                    >
                      <span>{eff.icon}</span>
                      <span>{eff.label}</span>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-900/60 px-1 py-0.2 rounded">
                        +{eff.points} pt
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Nessun effetto speciale quantificato (la carta è trattata come creatura vanilla con sole statistiche base).
                </p>
              )}
            </div>

            {/* Action Buttons: 1-Click Auto-Balancing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              
              {/* Button 1: Auto-Balance ATK/HP */}
              <button
                type="button"
                onClick={handleAutoBalanceStats}
                className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <Wand2 className="w-4 h-4 text-emerald-400" />
                Auto-Bilancia ATK / HP ({balanceReport.suggestedAtk}/{balanceReport.suggestedHp})
              </button>

              {/* Button 2: Auto-Balance Mana Cost */}
              <button
                type="button"
                onClick={handleAutoBalanceCost}
                className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                Adatta Costo Mana ({balanceReport.suggestedCost} Mana)
              </button>

            </div>

            {/* Flash Feedback Message */}
            {balanceFlash && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2.5 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {balanceFlash === 'stats'
                  ? `Statistiche aggiornate con successo a ${editingCard.atk} ATK / ${editingCard.hp} HP!`
                  : `Costo in Mana aggiornato a ${editingCard.cost} Mana!`}
              </div>
            )}

            {/* Didactic Advice & Tips Box */}
            <div className="text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5" /> Guida & Suggerimenti di Bilanciamento:
              </div>
              {balanceReport.advice.map((line, idx) => (
                <div key={idx} className="text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-400/80">•</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>

          </div>

          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <Save className="w-5 h-5" /> Salva Carta nel Catalogo
          </button>

        </div>

        {/* RIGHT COLUMN: Authentic Tactile 3D Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 bg-[#131922] border border-slate-800 rounded-2xl shadow-xl min-h-[620px]">
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Anteprima Carta Fisica Tattile
            </span>
            <div className="text-[11px] text-slate-500">
              (Muovi il mouse sopra per l'inclinazione 3D e i riflessi olografici)
            </div>
          </div>

          {/* Dynamic Card Display */}
          <div className="py-2">
            <TactileCard 
              card={editingCard}
              size="lg"
              interactive={true}
            />
          </div>

          {/* Quick Finish Switcher under card */}
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-800/80 w-full flex-wrap">
            {VARIANTS_LIST.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  soundEngine.playCardFlip();
                  handleInputChange('variant', v.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  (editingCard.variant || 'standard') === v.id
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* BOTTOM: Cards Catalog */}
      <div className="bg-[#131922] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="font-serif font-bold text-lg text-slate-200">
              Catalogo Carte Create ({cards.length})
            </h2>

            {cards.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                {selectedCardIds.size === cards.length ? (
                  <><CheckSquare className="w-3.5 h-3.5 text-amber-400" /> Deseleziona Tutte</>
                ) : (
                  <><Square className="w-3.5 h-3.5 text-slate-400" /> Seleziona Tutte</>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedCardIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black transition shadow-lg animate-pulse"
              >
                <Trash2 className="w-4 h-4" /> Elimina Carte Selezionate ({selectedCardIds.size})
              </button>
            )}

            {cards.length > 0 && onResetAllCards && (
              <button
                onClick={onResetAllCards}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Svuota Catalogo
              </button>
            )}
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Nessuna carta salvata nel catalogo. Seleziona una delle illustrazioni indie sopra o carica una tua immagine dal PC, poi clicca <strong>"Salva Carta nel Catalogo"</strong>!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cards.map(card => {
              const isSelected = selectedCardIds.has(card.id);
              const cardBal = analyzeCardBalance(card);

              return (
                <div 
                  key={card.id}
                  onClick={() => { setEditingCard(card); soundEngine.playCardFlip(); }}
                  className={`relative flex flex-col items-center group cursor-pointer p-2 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-amber-950/30 border-amber-400 shadow-glow-amber' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleSelectCard(card.id, e)}
                    className="absolute top-2 left-2 z-20 w-6 h-6 rounded-md bg-black/80 border border-slate-500 flex items-center justify-center transition hover:scale-110"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Eliminare la carta "${card.name}"?`)) {
                        onDeleteCard(card.id);
                        soundEngine.playDamage();
                      }
                    }}
                    className="absolute top-2 right-2 z-20 w-6 h-6 rounded-md bg-rose-950/80 border border-rose-600 text-rose-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:scale-110"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="transition-transform group-hover:scale-105 my-1">
                    <TactileCard 
                      card={card}
                      size="sm"
                      interactive={false}
                    />
                  </div>

                  <span className="text-[11px] font-bold text-slate-300 truncate w-full text-center mt-1">
                    {card.name}
                  </span>

                  {/* Balance badge for each catalog card */}
                  <div
                    className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1"
                    style={{
                      backgroundColor: `${cardBal.statusColor}15`,
                      borderColor: `${cardBal.statusColor}40`,
                      color: cardBal.statusColor
                    }}
                    title={`Bilanciamento: ${cardBal.balanceRatio}% (${cardBal.statusLabel})`}
                  >
                    <span>{cardBal.statusIcon}</span>
                    <span>{cardBal.balanceRatio}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { TactileCard, CARD_VARIANTS } from '../card/TactileCard';
import { 
  Sparkles, Save, Trash2, Download, Upload, Plus, Send, 
  CheckSquare, Square, CheckCircle2, AlertCircle, Copy, Image, Wand2, Palette, Crown
} from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';

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
  { id: 'full_art', label: 'Full-Art', icon: '🎨', desc: 'Artwork a Tutto Schermo' },
  { id: 'secret_holo', label: 'Secret Rare', icon: '👑', desc: 'Full-Art + Gold + Holo' }
];

export function CardStudio({ 
  cards = [], 
  onSaveCard, 
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
    cost: 7,
    atk: 2,
    hp: 9,
    rarity: 'rare',
    variant: 'full_art',
    accentColor: '#d97706',
    imageUrl: '/illustrations/mattolone.png',
    abilityTitle: 'CI SAREBBE DA FARE...',
    abilityText: 'Nascondi il portafoglio, sei il prossimo... "attitude da napoletano"',
    flavorText: 'Tecno-artigiano d\'eccellenza e maestro di chiavi inglesi.'
  });

  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [publishStatus, setPublishStatus] = useState(null);
  const [aiPromptSubject, setAiPromptSubject] = useState('un potente mago oscuro con tunica ricamata su pergamena antica');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
      cost: 3,
      atk: 3,
      hp: 4,
      rarity: 'rare',
      variant: 'standard',
      accentColor: '#2563eb',
      imageUrl: '/illustrations/tralalero_brainrot.png',
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
    reader.onload = (uploadEvent) => {
      setEditingCard(prev => ({
        ...prev,
        imageUrl: uploadEvent.target.result
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
    if (editingCard.rarity === 'legendary' || editingCard.rarity === 'mythic' || editingCard.variant === 'full_art' || editingCard.variant === 'secret_holo') {
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
    try {
      if (onPublishCards) {
        await onPublishCards(cards);
      } else {
        const res = await fetch('http://localhost:4000/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards })
        });
        if (!res.ok) throw new Error('Errore di pubblicazione');
      }
      setPublishStatus('success');
      setTimeout(() => setPublishStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(null), 4000);
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
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <div>
              <p className="font-bold">Errore di comunicazione con il Server (porta 4000)</p>
              <p className="text-xs text-rose-400/80">Assicurati che il backend sia avviato con `npm run server`.</p>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Costo Mana (Nastro a Sx)
              </label>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Forza Attacco (ATK)
              </label>
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Punti Vita (HP)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={editingCard.hp}
                onChange={(e) => handleInputChange('hp', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400 font-mono"
              />
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
                <option value="rare">Rara</option>
                <option value="epic">Epica</option>
                <option value="legendary">Leggendaria</option>
                <option value="mythic">Mitica</option>
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
              Descrizione Effetto & Meccaniche
            </label>
            <textarea
              rows="2"
              value={editingCard.abilityText}
              onChange={(e) => handleInputChange('abilityText', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
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

          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition hover:scale-[1.01] active:scale-[0.99]"
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
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}

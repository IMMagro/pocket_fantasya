import React, { useState } from 'react';
import { TactileCard } from '../card/TactileCard';
import { 
  Sparkles, Save, Trash2, Download, Upload, Plus, Send, 
  CheckSquare, Square, CheckCircle2, AlertCircle, Copy, Image, Wand2
} from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';

// Pre-packaged authentic indie-comic illustrations
const PRESET_ILLUSTRATIONS = [
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
    name: 'Void Golem',
    type: 'CREATURA',
    cost: 9,
    atk: 5,
    hp: 6,
    rarity: 'legendary',
    accentColor: '#9333ea',
    imageUrl: '/illustrations/void_golem.png',
    abilityTitle: 'VOID RESONANCE',
    abilityText: 'Alla fine del 3° Turno, se è ancora in campo, attiva il Caos ed infligge 4 danni a tutti i nemici.',
    flavorText: 'Nato dai frammenti d\'ossidiana nel cratere abissale.'
  });

  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [publishStatus, setPublishStatus] = useState(null);
  const [aiPromptSubject, setAiPromptSubject] = useState('un piccolo samurai robot con katana di cristallo blu');
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
      accentColor: '#2563eb',
      imageUrl: '',
      abilityTitle: 'ABILITÀ',
      abilityText: 'Descrizione dell\'effetto speciale o potere della carta.',
      flavorText: 'Testo di colore o lore descrittivo.'
    });
  };

  // Upload local image from user's PC (PNG/JPG)
  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      soundEngine.playCardPlay();
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingCard(prev => ({
          ...prev,
          imageUrl: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Select Preset Illustration
  const handleSelectPresetIllustration = (preset) => {
    soundEngine.playCardFlip();
    setEditingCard(prev => ({
      ...prev,
      name: prev.name === 'Nuova Carta' ? preset.defaultName : prev.name,
      imageUrl: preset.url,
      accentColor: preset.accentColor,
      abilityTitle: prev.abilityTitle === 'ABILITÀ' ? preset.defaultAbilityTitle : prev.abilityTitle,
      abilityText: prev.abilityText.includes('Descrizione') ? preset.defaultAbility : prev.abilityText,
      flavorText: prev.flavorText.includes('Testo di colore') ? preset.defaultFlavor : prev.flavorText
    }));
  };

  // Generate and Copy AI Prompt formatted for this exact indie art style
  const handleCopyAiPrompt = () => {
    const fullPrompt = `A detailed clean vector indie comic illustration of ${aiPromptSubject}, clean defined black ink line art, cross-hatching shadows, desaturated limited palette of charcoal, warm bone white and vivid accent color, isolated on a light warm cream matte paper background, tabletop physical card game art, indie graphic novel aesthetic.`;
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    soundEngine.playButtonClick();
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleSave = () => {
    soundEngine.playCardPlay();
    onSaveCard(editingCard);
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
            Card Studio: Creazione Carte Indie Tabletop
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            Crea carte tattili con stile inchiostrato indie comic e pubblicale per giocare con Antonio.
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
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105"
          >
            <Send className="w-4 h-4" />
            <span>{publishStatus === 'publishing' ? 'Invio in corso...' : '🚀 Pubblica Carte sul Gioco Ufficiale'}</span>
          </button>
        </div>
      </div>

      {/* PUBLISH NOTIFICATION */}
      {publishStatus === 'success' && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-300 text-sm font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Carte pubblicate con successo! Antonio e tu le vedrete subito nel gioco ufficiale.
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Card Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#131922] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-serif font-bold text-base text-slate-200">
              Parametri della Carta
            </h2>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow"
            >
              <Save className="w-4 h-4" /> Salva Carta nel Catalogo
            </button>
          </div>

          {/* Section: Artwork Selection & Upload */}
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Image className="w-4 h-4" /> Illustrazione Carta (Stile Indie Comic)
              </label>

              {/* Upload from PC */}
              <label className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" /> Carica Immagine dal tuo PC (PNG/JPG)
                <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
              </label>
            </div>

            {/* Presets Gallery */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Oppure scegli una delle illustrazioni inchiostrate autentiche predefinite:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_ILLUSTRATIONS.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPresetIllustration(preset)}
                    className={`p-2 rounded-xl border cursor-pointer flex flex-col items-center gap-1.5 transition ${
                      editingCard.imageUrl === preset.url
                        ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.title} 
                      className="w-16 h-16 object-contain rounded-lg bg-[#faf8f2]"
                    />
                    <span className="text-[10px] font-bold text-slate-200 text-center truncate w-full">
                      {preset.title}
                    </span>
                  </div>
                ))}
              </div>
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
                Costo (Badge Pillola in Alto a Sx)
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
                Rarità & Foil
              </label>
              <select
                value={editingCard.rarity}
                onChange={(e) => handleInputChange('rarity', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="common">Comune</option>
                <option value="rare">Rara</option>
                <option value="epic">Epica (Foil Olografico)</option>
                <option value="legendary">Leggendaria (Foil Olografico)</option>
                <option value="mythic">Mitica (Foil Olografico)</option>
              </select>
            </div>

            {/* Ability Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Parola Chiave Abilità (Es: VOID RESONANCE)
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
              Testo Descrizione Effetto / Abilità
            </label>
            <textarea
              rows="2"
              value={editingCard.abilityText}
              onChange={(e) => handleInputChange('abilityText', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Flavor Lore */}
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

        </div>

        {/* RIGHT COLUMN: Authentic Tactile 3D Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#131922] border border-slate-800 rounded-2xl shadow-xl min-h-[620px]">
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Anteprima Carta Fisica Tattile
            </span>
            <div className="text-[11px] text-slate-500">
              (Muovi il mouse sopra per l'inclinazione 3D e i riflessi)
            </div>
          </div>

          <TactileCard 
            card={editingCard}
            size="lg"
            interactive={true}
          />
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

// ============================================================
// CATALOGO EFFETTI — unica fonte di verità dei tipi di effetto
// ------------------------------------------------------------
// Questo file elenca TUTTI i tipi di effetto del gioco con i loro metadati.
// - Il Card Studio genera l'editor delle abilità da qui (così ogni effetto
//   creato usa un tipo valido, gestito davvero dal motore).
// - Il motore (gameEngine.applyEffects / executeTurnTriggers) applica gli
//   effetti "built-in" via switch; per aggiungere un NUOVO effetto in futuro
//   basta: 1) aggiungerlo qui (per l'editor) e 2) registrare la sua funzione
//   in CUSTOM_EFFECT_HANDLERS (per il motore). Nessun'altra modifica.
//
// Campi di un effetto:
//   id        stringa tipo (deve combaciare con l'handler del motore)
//   label     etichetta mostrata nell'editor
//   value     { key, label, default } se ha un valore numerico (es. danni)
//   dual      true se richiede due valori (atk/hp, es. buff_board)
//   token     true se richiede la scelta di una carta/token da evocare
//   studio    false per nasconderlo dall'editor semplice (effetti speciali)
// ============================================================

// Effetti one-shot: usabili come Battlecry (all'entrata) o Deathrattle (alla morte)
export const INSTANT_EFFECTS = [
  { id: 'hero_damage',       label: "Danno all'Eroe nemico",              value: { key: 'value', label: 'Danni', default: 2 } },
  { id: 'creature_damage',   label: 'Danno a una creatura nemica',         value: { key: 'value', label: 'Danni', default: 3 } },
  { id: 'aoe_enemy_damage',  label: 'Danno a tutte le creature nemiche',   value: { key: 'value', label: 'Danni', default: 2 } },
  { id: 'heal_hero',         label: 'Cura il tuo Eroe',                    value: { key: 'value', label: 'HP',    default: 3 } },
  { id: 'draw',              label: 'Pesca carte',                         value: { key: 'value', label: 'Carte', default: 1 } },
  { id: 'max_mana',          label: '+Mana massimo',                       value: { key: 'value', label: 'Mana',  default: 1 } },
  { id: 'steal_mana',        label: "Ruba Mana all'avversario",            value: { key: 'value', label: 'Mana',  default: 1 } },
  { id: 'steal_card',        label: 'Ruba una carta dalla mano avversaria' },
  { id: 'destroy_minion',    label: 'Distruggi una creatura nemica' },
  { id: 'summon_token',      label: 'Evoca una carta/token',               token: true },
  { id: 'buff_board',        label: 'Potenzia le tue creature (+ATK/+HP)', dual: true },
  { id: 'absorb_broken_sync', label: 'Assorbi i Sincronizzatori rotti',    studio: false },
];

// Effetti passivi che scattano a ogni turno (turnTriggers)
export const TURN_EFFECTS = [
  { id: 'hero_burn',   label: "Danno all'Eroe nemico ogni turno", value: { key: 'value', label: 'Danni', default: 1 } },
  { id: 'spawn_token', label: 'Evoca un token ogni turno',        token: true },
];

// Keyword passive, applicate all'evocazione (gestite in playCard)
export const KEYWORD_EFFECTS = [
  { id: 'taunt',        label: 'Guardiano (i nemici devono attaccarla)' },
  { id: 'divineShield', label: 'Scudo Divino (annulla il primo colpo)' },
  { id: 'thorns',       label: 'Spine (danni a chi la attacca)', value: { key: 'thorns', label: 'Danni', default: 1 } },
];

// Effetti disponibili nell'editor semplice (single-value o senza valore, escluse le keyword)
export const STUDIO_INSTANT_EFFECTS = INSTANT_EFFECTS.filter(e => e.studio !== false && !e.dual);
export const STUDIO_TURN_EFFECTS = TURN_EFFECTS.filter(e => e.studio !== false && !e.dual);

// Insieme di tutti i tipi gestiti dal motore (per validazione/diagnostica)
export const HANDLED_EFFECT_TYPES = new Set([
  ...INSTANT_EFFECTS.map(e => e.id),
  ...TURN_EFFECTS.map(e => e.id),
]);

// ------------------------------------------------------------
// REGISTRO EFFETTI FUTURI
// Aggiungi qui la funzione per un NUOVO tipo di effetto non gestito dallo switch
// del motore. Verrà chiamata automaticamente da applyEffects.
// Firma: (ctx) => void, dove ctx = {
//   state, isPlayer, active, enemy, effect, sourceCard, helpers
// } e helpers = { pushLog, dealDamageToHero, drawCard, cleanupDeadMinions,
//   resolveDeathrattle, createTokenMinion }.
// Esempio:
//   freeze_enemy: ({ enemy, effect, helpers, state }) => {
//     enemy.board.forEach(m => { m.stunned = true; });
//     helpers.pushLog(state, 'Nemici congelati!', 'info');
//   },
// ------------------------------------------------------------
export const CUSTOM_EFFECT_HANDLERS = {};

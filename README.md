# Pocket Fantasya / Card Clash TCG 🎴

> **Tactile Vintage Parchment Trading Card Game & Creator Studio**

Pocket Fantasya (Card Clash) è un gioco di carte collezionabili (TCG) indie tabletop digitale con supporto multiplayer in tempo reale, creazione carte avanzata con design tattile 1:1 e apertura pacchetti.

---

## 🌟 Caratteristiche Principali

- 📜 **Tactile Vintage Parchment Design (1:1):** Carte con resa visiva materica su pergamena avorio (`#FAF7EE`), nastro di costo mana sospeso verde petrolio (`#6C8D88`), tipografia Cinzel, barra glifi geometrici di comando `─── [ ◐ ] [ ◑ ] [ ◉ ] [ ⬝ ] ───`, box effetto/lore e shader olografico foil per rarità elevate.
- 👑 **Card Creator Studio:** Editor visivo per creare nuove carte personalizzate (creature o magie), caricare illustrazioni dal proprio PC o scegliere dai preset inchiostrati, e pubblicarle direttamente nel gioco.
- 🔄 **Realtime WebSocket Server (Porta 4000):** Sincronizzazione istantanea delle carte create e del catalogo tra tutti i giocatori.
- 📦 **Apertura Pacchetti & Collezione:** Album dinamico con filtri per rarità, costo e tipologia, con modale di ispezione 3D interattiva a inclinazione fisica (tilt effect).
- ⚔️ **Arena di Battaglia & Deck Builder:** Costruzione mazzo con curva del mana e scontro tattico sul campo.

---

## 🚀 Avvio Rapido

### 1. Installazione dipendenze
```bash
npm install
cd server && npm install && cd ..
```

### 2. Avvio del Server & Gioco
Puoi usare gli script `.bat` rapidi inclusi:
- `start-game.bat` oppure `run-game.bat`

Oppure da terminale:
```bash
# Avvia il server backend (porta 4000)
npm run server

# In un altro terminale, avvia il frontend Vite (porta 5173 / 5176)
npm run dev
```

---

## 📂 Struttura del Progetto

```
pocket_Fantasya/
├── server/                 # Backend Node.js & WebSocket per sincronizzazione carte
│   ├── data/cards.json     # Catalogo persistente delle carte
│   └── index.js            # Server Express + WebSocket (Porta 4000)
├── src/
│   ├── components/
│   │   ├── card/           # TactileCard.jsx (Sistema 1:1 di rendering carte)
│   │   └── card-studio/    # CardStudio.jsx (Studio di creazione carte)
│   ├── mockup/             # Nuova interfaccia grafica (NewUI, Collezione, DeckBuilder, Arena)
│   ├── styles/             # tactile-card.css (Design system tattile vintage)
│   ├── App.jsx             # Entrypoint principale
│   └── CreatorApp.jsx      # Entrypoint standalone Card Studio
├── public/                 # Risorse grafiche, suoni e illustrazioni indie
├── newui.html              # Preview della nuova interfaccia
└── index.html              # Entrypoint web
```

---

## 📜 Licenza
Progetto sviluppato per Pocket Fantasya TCG.
